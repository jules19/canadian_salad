import { customAlphabet } from 'nanoid';
import { Room, Player, RoomStatus } from './types';
import { ROUND_CONFIGS, dealCards, sortHand } from './game-engine';

// Generate readable 4-character room codes (no confusing characters)
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

const ROOM_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours
const DISCONNECT_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor() {
    // Run cleanup every 10 minutes
    setInterval(() => this.cleanupExpiredRooms(), 10 * 60 * 1000);
  }

  /**
   * Creates a new room with a host player
   */
  createRoom(hostId: string, hostName: string): Room {
    const roomId = nanoid();
    const now = Date.now();

    const host: Player = {
      id: hostId,
      name: hostName,
      hand: [],
      handCount: 0,
      score: 0,
      roundScore: 0,
      tricksTaken: [],
      connected: true,
      lastSeen: now
    };

    const room: Room = {
      roomId,
      status: 'WAITING',
      roundInfo: ROUND_CONFIGS[0], // Start with round 1
      players: [host],
      currentTrick: [],
      activePlayerIndex: 0,
      leadSuit: null,
      deck: [],
      hostId,
      createdAt: now,
      lastActivity: now,
      trickNumber: 0,
      totalTricks: 0
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Adds a player to an existing room
   */
  joinRoom(roomId: string, playerId: string, playerName: string): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    // Can't join if game already started
    if (room.status !== 'WAITING') {
      return null;
    }

    // Max 4 players
    if (room.players.length >= 4) {
      return null;
    }

    // Check if player already in room
    if (room.players.some(p => p.id === playerId)) {
      return room;
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      handCount: 0,
      score: 0,
      roundScore: 0,
      tricksTaken: [],
      connected: true,
      lastSeen: Date.now()
    };

    room.players.push(newPlayer);
    room.lastActivity = Date.now();

    return room;
  }

  /**
   * Starts the game for a room
   */
  startGame(roomId: string): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    // Need 3-4 players
    if (room.players.length < 3 || room.players.length > 4) {
      return null;
    }

    // Deal cards
    const { hands } = dealCards(room.players.length);

    room.players.forEach((player, index) => {
      player.hand = sortHand(hands[index]);
      player.handCount = player.hand.length;
      player.score = 0;
      player.roundScore = 0;
      player.tricksTaken = [];
    });

    room.status = 'PLAYING';
    room.roundInfo = ROUND_CONFIGS[0];
    room.activePlayerIndex = 0;
    room.currentTrick = [];
    room.leadSuit = null;
    room.trickNumber = 1;
    room.totalTricks = room.players[0].hand.length; // Total tricks = cards per player
    room.lastActivity = Date.now();

    return room;
  }

  /**
   * Advances to the next round
   */
  nextRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const nextRoundNum = room.roundInfo.roundNumber + 1;

    if (nextRoundNum > 6) {
      room.status = 'FINISHED';
      return room;
    }

    // Deal new cards
    const { hands } = dealCards(room.players.length);

    room.players.forEach((player, index) => {
      player.hand = sortHand(hands[index]);
      player.handCount = player.hand.length;
      player.roundScore = 0;
      player.tricksTaken = [];
    });

    room.roundInfo = ROUND_CONFIGS[nextRoundNum - 1];
    room.status = 'PLAYING';
    room.activePlayerIndex = 0;
    room.currentTrick = [];
    room.leadSuit = null;
    room.trickNumber = 1;
    room.totalTricks = room.players[0].hand.length;
    room.lastActivity = Date.now();

    return room;
  }

  /**
   * Gets a room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Updates player connection status
   */
  updatePlayerConnection(roomId: string, playerId: string, connected: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = connected;
      player.lastSeen = Date.now();
    }
  }

  /**
   * Handles player reconnection
   */
  reconnectPlayer(roomId: string, oldSocketId: string, newSocketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === oldSocketId);
    if (!player) return null;

    // Update player ID to new socket
    player.id = newSocketId;
    player.connected = true;
    player.lastSeen = Date.now();

    // Update active player index if needed
    const playerIndex = room.players.findIndex(p => p.id === newSocketId);
    if (playerIndex !== -1 && room.players[room.activePlayerIndex].id === oldSocketId) {
      room.activePlayerIndex = playerIndex;
    }

    return room;
  }

  /**
   * Removes disconnected players who exceeded grace period
   */
  kickDisconnectedPlayers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const now = Date.now();
    const kicked: string[] = [];

    room.players = room.players.filter(player => {
      if (!player.connected && (now - player.lastSeen) > DISCONNECT_GRACE_PERIOD_MS) {
        kicked.push(player.id);
        return false;
      }
      return true;
    });

    // If too few players left, end game
    if (room.status === 'PLAYING' && room.players.length < 3) {
      room.status = 'FINISHED';
    }

    return kicked;
  }

  /**
   * Deletes a room
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Cleans up expired rooms
   */
  private cleanupExpiredRooms(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (now - room.lastActivity > ROOM_EXPIRY_MS) {
        toDelete.push(roomId);
      }
    });

    toDelete.forEach(roomId => {
      console.log(`Cleaning up expired room: ${roomId}`);
      this.rooms.delete(roomId);
    });
  }

  /**
   * Gets all active rooms (for debugging/admin)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Gets room count (for monitoring)
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}
