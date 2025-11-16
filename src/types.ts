// Card representation: e.g., "H2" = 2 of Hearts, "SK" = King of Spades
export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type Card = string; // Format: SuitRank (e.g., "H2", "SK")

export type RoomStatus = 'WAITING' | 'PLAYING' | 'ROUND_END' | 'FINISHED';

export type RoundName =
  | 'No Tricks'     // Round 1: 10 pts per trick taken
  | 'No Hearts'     // Round 2: 10 pts per Heart taken
  | 'No Queens'     // Round 3: 25 pts per Queen taken
  | 'No King of Spades'  // Round 4: 100 pts for King of Spades
  | 'Last Trick'    // Round 5: 100 pts for last trick
  | 'The Salad';    // Round 6: All rules combined

export interface RoundInfo {
  roundNumber: number;  // 1-6
  ruleName: RoundName;
  description: string;
}

export interface Player {
  id: string;           // Socket ID
  name: string;
  hand: Card[];         // Private to this player
  handCount: number;    // Public info
  score: number;        // Cumulative score across all rounds
  roundScore: number;   // Score for current round
  tricksTaken: Card[][]; // Tricks won this round
  connected: boolean;
  lastSeen: number;     // Timestamp for disconnect handling
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface Room {
  roomId: string;
  status: RoomStatus;
  roundInfo: RoundInfo;
  players: Player[];
  currentTrick: TrickCard[];
  activePlayerIndex: number;
  leadSuit: Suit | null;
  deck: Card[];
  hostId: string;       // Player who created the room
  createdAt: number;
  lastActivity: number;
  trickNumber: number;  // Which trick in the round (for Last Trick rule)
  totalTricks: number;  // Total tricks in the round
}

// Client-side state (filtered for each player)
export interface ClientGameState {
  roomId: string;
  status: RoomStatus;
  roundInfo: RoundInfo;
  players: ClientPlayer[];
  currentTrick: TrickCard[];
  activePlayerIndex: number;
  leadSuit: Suit | null;
  myPlayerId: string;
  myHand: Card[];
  trickNumber: number;
  totalTricks: number;
}

export interface ClientPlayer {
  id: string;
  name: string;
  handCount: number;
  score: number;
  roundScore: number;
  trickCount: number;
  connected: boolean;
}

// Socket.io event payloads
export interface JoinRoomPayload {
  roomCode?: string;  // If joining existing room
  name: string;
}

export interface PlayCardPayload {
  card: Card;
}

export interface ErrorPayload {
  message: string;
}

export interface GameOverPayload {
  winner: ClientPlayer;
  finalScores: ClientPlayer[];
}
