import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './room-manager';
import { GameState } from './game-state';
import { StatePersistence } from './state-persistence';
import { JoinRoomPayload, PlayCardPayload, Room } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Configure this properly in production
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Core managers
const roomManager = new RoomManager();
const gameState = new GameState();
const persistence = new StatePersistence();

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  let currentRoomId: string | null = null;

  /**
   * Create or join a room
   */
  socket.on('joinRoom', (payload: JoinRoomPayload, callback) => {
    try {
      let room: Room | null;

      if (payload.roomCode) {
        // Join existing room
        room = roomManager.joinRoom(payload.roomCode.toUpperCase(), socket.id, payload.name);

        if (!room) {
          callback({ error: 'Room not found or game already started' });
          return;
        }
      } else {
        // Create new room
        room = roomManager.createRoom(socket.id, payload.name);
      }

      currentRoomId = room.roomId;
      socket.join(room.roomId);

      // Send room state to all players
      emitGameState(room);

      callback({ success: true, roomId: room.roomId });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  /**
   * Start the game (host only)
   */
  socket.on('startGame', (callback) => {
    try {
      if (!currentRoomId) {
        callback({ error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(currentRoomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      // Verify player is host
      if (room.hostId !== socket.id) {
        callback({ error: 'Only the host can start the game' });
        return;
      }

      // Start the game
      const updatedRoom = roomManager.startGame(currentRoomId);
      if (!updatedRoom) {
        callback({ error: 'Cannot start game (need 3-4 players)' });
        return;
      }

      emitGameState(updatedRoom);
      callback({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ error: 'Failed to start game' });
    }
  });

  /**
   * Play a card
   */
  socket.on('playCard', (payload: PlayCardPayload, callback) => {
    try {
      if (!currentRoomId) {
        callback({ error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(currentRoomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      // Attempt to play the card
      const error = gameState.playCard(room, socket.id, payload.card);

      if (error) {
        callback({ error });
        return;
      }

      // Check if game is over
      if (room.status === 'FINISHED') {
        const gameOverState = gameState.getGameOverState(room);
        io.to(room.roomId).emit('gameOver', gameOverState);
      }

      emitGameState(room);
      callback({ success: true });
    } catch (error) {
      console.error('Error playing card:', error);
      callback({ error: 'Failed to play card' });
    }
  });

  /**
   * Continue to next round
   */
  socket.on('nextRound', (callback) => {
    try {
      if (!currentRoomId) {
        callback({ error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(currentRoomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      if (room.status !== 'ROUND_END') {
        callback({ error: 'Round has not ended' });
        return;
      }

      const updatedRoom = roomManager.nextRound(currentRoomId);
      if (!updatedRoom) {
        callback({ error: 'Failed to start next round' });
        return;
      }

      // Check if game is fully over
      if (updatedRoom.status === 'FINISHED') {
        const gameOverState = gameState.getGameOverState(updatedRoom);
        io.to(updatedRoom.roomId).emit('gameOver', gameOverState);
      }

      emitGameState(updatedRoom);
      callback({ success: true });
    } catch (error) {
      console.error('Error starting next round:', error);
      callback({ error: 'Failed to start next round' });
    }
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    if (currentRoomId) {
      roomManager.updatePlayerConnection(currentRoomId, socket.id, false);

      const room = roomManager.getRoom(currentRoomId);
      if (room) {
        emitGameState(room);

        // Check for expired disconnections after grace period
        setTimeout(() => {
          const kicked = roomManager.kickDisconnectedPlayers(currentRoomId!);
          if (kicked.length > 0) {
            const updatedRoom = roomManager.getRoom(currentRoomId!);
            if (updatedRoom) {
              emitGameState(updatedRoom);

              // Notify about kicked players
              io.to(currentRoomId!).emit('playersKicked', {
                message: `${kicked.length} player(s) removed due to disconnect`
              });
            }
          }
        }, 5 * 60 * 1000); // 5 minute grace period
      }
    }
  });

  /**
   * Helper function to emit game state to all players in room
   */
  function emitGameState(room: Room) {
    room.players.forEach(player => {
      const clientState = gameState.getClientState(room, player.id);
      io.to(player.id).emit('gameStateUpdate', clientState);
    });
  }
});

// Load previous state on startup
const savedRooms = persistence.loadLatestSnapshot();
if (savedRooms && savedRooms.length > 0) {
  console.log(`Restored ${savedRooms.length} rooms from snapshot`);
  // Note: Would need to implement room restoration in RoomManager for full recovery
}

// Start periodic snapshots
persistence.startPeriodicSnapshots(() => roomManager.getAllRooms());

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  persistence.saveBeforeShutdown(roomManager.getAllRooms());
  persistence.stopPeriodicSnapshots();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  persistence.saveBeforeShutdown(roomManager.getAllRooms());
  persistence.stopPeriodicSnapshots();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Canadian Salad server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to play`);
});
