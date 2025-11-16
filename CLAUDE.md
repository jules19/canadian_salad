# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Canadian Salad Online is a browser-based multiplayer card game for 3-4 players. It's a real-time, synchronized card game that must be free/low-cost to host with no installation required for players.

## Architecture

**Client-Server Event-Driven Architecture**

- **Server (Backend):** Authoritative state manager handling deck shuffling, rule enforcement, and score calculation. No database required for MVP.
- **Client (Frontend):** "Dumb terminal" that renders server state and sends user inputs.
- **Transport:** WebSockets via Socket.io for full-duplex real-time communication.

## Technology Stack

- **Runtime:** Node.js (LTS)
- **Backend:** Express.js + Socket.io
- **Frontend:** Vue.js, React, or Vanilla JS
- **Deployment:** Render, Railway, or Glitch (must support WebSockets)

## Key Data Model

The server maintains a Room object as the single source of truth:

```json
{
  "roomId": "WINE",
  "status": "PLAYING",
  "roundInfo": {
    "roundNumber": 1,
    "ruleName": "No Tricks"
  },
  "players": [
    {
      "id": "socket_id_1",
      "name": "Alice",
      "hand": ["H2", "H3", "DK"],  // Private to player
      "handCount": 3,               // Public
      "score": 50,
      "tricksTaken": []
    }
  ],
  "currentTrick": [
    { "playerId": "socket_id_1", "card": "H10" }
  ],
  "activePlayerIndex": 1,
  "leadSuit": "HEARTS"
}
```

## Socket.io Events

**Client → Server:**
- `joinRoom({roomCode, name})`
- `playCard({cardCode})`
- `restartGame()`

**Server → Client:**
- `gameStateUpdate(stateObject)`
- `error({message})`
- `gameOver({winner})`

## Critical Game Rules

### Deck Management
- Standard 52-card deck
- **3-player exception:** Remove 2 of Diamonds (51 cards total) for equal distribution

### Turn Validation
- **Suit following is mandatory:** If a player holds any card of the lead suit, they MUST play it
- Server must validate card ownership and suit following rules
- Play proceeds clockwise from the trick winner

### Round Scoring (Points are penalties - lowest wins)
1. **No Tricks:** 10 pts per trick taken
2. **No Hearts:** 10 pts per Heart taken
3. **No Queens:** 25 pts per Queen taken
4. **No King of Spades:** 100 pts for KS
5. **Last Trick:** 100 pts for last trick
6. **The Salad:** All above rules active simultaneously

## Development Commands

Once project is initialized:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- <test-file-name>

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Performance Constraints

- **Latency target:** <200ms from card click to visual update
- **Reconnection:** Support localStorage/Session ID reconnection for page refreshes
- **Viewport:** Must fit 1366x768 without scrolling (allow space for Zoom window)

## State Management Philosophy

- Server is the ONLY source of truth
- Client receives filtered state (players only see their own hands)
- All game logic validation happens server-side
- Client is purely presentational with input handling
