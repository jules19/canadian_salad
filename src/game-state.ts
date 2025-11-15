import { Room, Card, Suit, Player } from './types';
import {
  canPlayCard,
  parseCard,
  getTrickWinner,
  calculateTrickScore,
  sortHand
} from './game-engine';

export class GameState {
  /**
   * Handles a player playing a card
   * Returns error message if invalid, null if successful
   */
  playCard(room: Room, playerId: string, card: Card): string | null {
    // Verify it's the player's turn
    const activePlayer = room.players[room.activePlayerIndex];
    if (activePlayer.id !== playerId) {
      return 'Not your turn';
    }

    // Verify player has the card
    if (!activePlayer.hand.includes(card)) {
      return 'You do not have that card';
    }

    // Verify card follows suit rules
    if (!canPlayCard(card, activePlayer.hand, room.leadSuit)) {
      return 'You must follow suit';
    }

    // Play the card
    activePlayer.hand = activePlayer.hand.filter(c => c !== card);
    activePlayer.handCount = activePlayer.hand.length;

    // Add to current trick
    room.currentTrick.push({ playerId, card });

    // Set lead suit if this is first card of trick
    if (room.currentTrick.length === 1) {
      const { suit } = parseCard(card);
      room.leadSuit = suit;
    }

    // Check if trick is complete
    if (room.currentTrick.length === room.players.length) {
      this.resolveTrick(room);
    } else {
      // Move to next player
      room.activePlayerIndex = (room.activePlayerIndex + 1) % room.players.length;
    }

    room.lastActivity = Date.now();
    return null;
  }

  /**
   * Resolves a completed trick
   */
  private resolveTrick(room: Room): void {
    if (!room.leadSuit) return;

    // Determine winner
    const winnerIndex = getTrickWinner(room.currentTrick, room.leadSuit);
    const winnerCard = room.currentTrick[winnerIndex];

    // Find the actual player index from player ID
    const winnerPlayerIndex = room.players.findIndex(p => p.id === winnerCard.playerId);

    // Give trick to winner
    const trickCards = room.currentTrick.map(tc => tc.card);
    room.players[winnerPlayerIndex].tricksTaken.push(trickCards);

    // Calculate penalty points for this trick
    const isLastTrick = room.trickNumber === room.totalTricks;
    const points = calculateTrickScore(trickCards, room.roundInfo.ruleName, isLastTrick);
    room.players[winnerPlayerIndex].roundScore += points;

    // Check if round is over (all cards played)
    const roundOver = room.players.every(p => p.hand.length === 0);

    if (roundOver) {
      this.endRound(room);
    } else {
      // Start new trick with winner leading
      room.currentTrick = [];
      room.leadSuit = null;
      room.activePlayerIndex = winnerPlayerIndex;
      room.trickNumber++;
    }
  }

  /**
   * Ends the current round and updates scores
   */
  private endRound(room: Room): void {
    // Add round scores to cumulative scores
    room.players.forEach(player => {
      player.score += player.roundScore;
    });

    room.status = 'ROUND_END';
    room.lastActivity = Date.now();
  }

  /**
   * Converts room state to client-safe state for a specific player
   */
  getClientState(room: Room, playerId: string) {
    const player = room.players.find(p => p.id === playerId);

    return {
      roomId: room.roomId,
      status: room.status,
      roundInfo: room.roundInfo,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        handCount: p.handCount,
        score: p.score,
        roundScore: p.roundScore,
        trickCount: p.tricksTaken.length,
        connected: p.connected
      })),
      currentTrick: room.currentTrick,
      activePlayerIndex: room.activePlayerIndex,
      leadSuit: room.leadSuit,
      myPlayerId: playerId,
      myHand: player ? sortHand(player.hand) : [],
      trickNumber: room.trickNumber,
      totalTricks: room.totalTricks
    };
  }

  /**
   * Gets game over state with winner
   */
  getGameOverState(room: Room) {
    const sortedPlayers = [...room.players].sort((a, b) => a.score - b.score);

    return {
      winner: {
        id: sortedPlayers[0].id,
        name: sortedPlayers[0].name,
        handCount: 0,
        score: sortedPlayers[0].score,
        roundScore: 0,
        trickCount: 0,
        connected: sortedPlayers[0].connected
      },
      finalScores: sortedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        handCount: 0,
        score: p.score,
        roundScore: 0,
        trickCount: 0,
        connected: p.connected
      }))
    };
  }
}
