# canadian_salad

Here is a streamlined Technical Requirements Specification (TRS) for an online Canadian Salad game. You can use this as a roadmap for development.

-----

# Technical Requirements Specification: Online Canadian Salad

## 1\. Project Overview

**Project Name:** Canadian Salad Online
**Objective:** To build a lightweight, browser-based multiplayer card game for 3–4 players, facilitating real-time play with synchronized game state.
**Core constraint:** The system must be free/low-cost to host and require no installation for players.

## 2\. System Architecture

The system will utilize a **Client-Server** architecture with **Event-Driven** communication.

  * **Server (Backend):** Authoritative state manager. It handles deck shuffling, rule enforcement, and score calculation. It does not store long-term data (database not strictly required for MVP).
  * **Client (Frontend):** A "dumb" terminal. It renders the state provided by the server and sends user inputs (card clicks).
  * **Transport Layer:** WebSockets (via Socket.io) for full-duplex, real-time communication.

## 3\. Technology Stack

  * **Runtime Environment:** Node.js (LTS version).
  * **Backend Framework:** Express.js (for serving static files) + Socket.io (for game logic).
  * **Frontend Framework:** Vue.js or React (for reactive UI updates) or Vanilla JS (for simplicity).
  * **Styling:** CSS3 with Flexbox/Grid for responsive card layouts.
  * **Hosting:** Render, Railway, or Glitch (PaaS supporting WebSockets).

## 4\. Functional Requirements

### 4.1. Lobby & Connection

  * **FR-01:** User must be able to create a "Room" and receive a unique 4-character Room ID.
  * **FR-02:** User must be able to join an existing room using the Room ID.
  * **FR-03:** User must be able to input a display name.
  * **FR-04:** The game must wait until the host triggers "Start Game" (requires 3 or 4 connected players).

### 4.2. Core Game Logic (Server-Side)

  * **FR-05 Deck Management:** Server must generate a standard 52-card deck.
      * *Constraint:* If 3 players, remove the 2 of Diamonds (51 cards total) to ensure equal hands.
  * **FR-06 Dealing:** Server must distribute the deck entirely and equally among players.
  * **FR-07 Turn Management:**
      * Play proceeds clockwise.
      * Server tracks the `activePlayerIndex`.
      * Server validates that the played card belongs to the player's hand.
      * **Suit Validation:** If a player holds a card of the "lead suit," they *must* play it. If not, they may play any card.
  * **FR-08 Trick Resolution:**
      * Server determines the winner of the trick (highest card of the led suit).
      * Server moves the trick cards to the winner's "Pile" for scoring.
      * Winner leads the next trick.

### 4.3. Canadian Salad Specifics (Round Logic)

The server must support distinct scoring rules for different rounds.

  * **Round 1 (No Reds):** 10 pts per Trick taken.
  * **Round 2 (No Tricks):** 10 pts per Heart card taken.
  * **Round 3 (No Queens):** 100 pts per Queen taken.
  * **Round 4 (No King of Spades):** 100 pts for KS.
  * **Round 5 (Last Trick):** 100 pts for taking the last trick.
  * **Round 6 (The Salad):** All previous rules active simultaneously.
  * *Note:* In Canadian Salad, points are usually "bad." Lowest score wins.

### 4.4. Frontend/UI Requirements

  * **FR-09 Hand Display:** Player sees their own cards sorted by Suit and Rank.
  * **FR-10 Table Display:** Player sees the cards played by opponents in the current trick.
  * **FR-11 Scoreboard:** A persistent overlay showing current cumulative scores.
  * **FR-12 Feedback:** Visual indicator of whose turn it is.
  * **FR-13 Animations:** CSS transition for cards moving from "Hand" to "Table."

## 5\. Data Model (JSON State)

The server will maintain a `Room` object. This is the source of truth sent to clients.

```json
{
  "roomId": "WINE",
  "status": "PLAYING", // WAITING, PLAYING, FINISHED
  "roundInfo": {
    "roundNumber": 1,
    "ruleName": "No Tricks"
  },
  "players": [
    {
      "id": "socket_id_1",
      "name": "Alice",
      "hand": ["H2", "H3", "DK"], // Server only sends this to Alice
      "handCount": 3, // Public info
      "score": 50,
      "tricksTaken": []
    }
  ],
  "currentTrick": [
    { "playerId": "socket_id_1", "card": "H10" },
    { "playerId": "socket_id_2", "card": "HJ" }
  ],
  "activePlayerIndex": 1,
  "leadSuit": "HEARTS"
}
```

## 6\. Non-Functional Requirements

  * **NFR-01 Latency:** Interaction response (clicking a card to seeing it move) should be under 200ms under normal network conditions.
  * **NFR-02 Reconnection:** If a player refreshes the page, the server should identify them by `localStorage` ID or Session ID and reconnect them to their hand (basic crash recovery).
  * **NFR-03 Responsiveness:** The UI must fit within a standard laptop browser window (1366x768) without scrolling, allowing space for a Zoom window alongside.

## 7\. API / Event Definition (Socket.io)

**Client $\rightarrow$ Server:**

  * `joinRoom({roomCode, name})`
  * `playCard({cardCode})`
  * `restartGame()`

**Server $\rightarrow$ Client:**

  * `gameStateUpdate(stateObject)`
  * `error({message})` (e.g., "You must follow suit\!")
  * `gameOver({winner})`

-----
