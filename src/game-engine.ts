import { Card, Suit, Rank, Player, TrickCard, RoundInfo, RoundName } from './types';

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const ROUND_CONFIGS: RoundInfo[] = [
  { roundNumber: 1, ruleName: 'No Reds', description: '10 points per red card taken' },
  { roundNumber: 2, ruleName: 'No Tricks', description: '10 points per Heart taken' },
  { roundNumber: 3, ruleName: 'No Queens', description: '100 points per Queen taken' },
  { roundNumber: 4, ruleName: 'No King of Spades', description: '100 points for King of Spades' },
  { roundNumber: 5, ruleName: 'Last Trick', description: '100 points for taking the last trick' },
  { roundNumber: 6, ruleName: 'The Salad', description: 'All previous rules combined!' }
];

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${suit}${rank}`);
    }
  }
  return deck;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards to players. For 3 players, removes 2 of Diamonds first.
 */
export function dealCards(playerCount: number): { hands: Card[][], deck: Card[] } {
  let deck = createDeck();

  // For 3 players, remove 2 of Diamonds to get 51 cards (17 each)
  if (playerCount === 3) {
    deck = deck.filter(card => card !== 'D2');
  }

  deck = shuffle(deck);

  const cardsPerPlayer = Math.floor(deck.length / playerCount);
  const hands: Card[][] = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer));
  }

  return { hands, deck };
}

/**
 * Parses a card string into suit and rank
 */
export function parseCard(card: Card): { suit: Suit, rank: Rank } {
  const suit = card[0] as Suit;
  const rank = card.slice(1) as Rank;
  return { suit, rank };
}

/**
 * Sorts a hand by suit then rank
 */
export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { 'C': 0, 'D': 1, 'H': 2, 'S': 3 };

  return [...hand].sort((a, b) => {
    const cardA = parseCard(a);
    const cardB = parseCard(b);

    if (cardA.suit !== cardB.suit) {
      return suitOrder[cardA.suit] - suitOrder[cardB.suit];
    }

    return RANK_VALUES[cardA.rank] - RANK_VALUES[cardB.rank];
  });
}

/**
 * Determines if a player can legally play a card
 */
export function canPlayCard(card: Card, hand: Card[], leadSuit: Suit | null): boolean {
  // First card of trick - can play anything
  if (!leadSuit) {
    return hand.includes(card);
  }

  const { suit } = parseCard(card);

  // Must follow suit if possible
  const hasLeadSuit = hand.some(c => parseCard(c).suit === leadSuit);

  if (hasLeadSuit) {
    return suit === leadSuit;
  }

  // Can play any card if don't have lead suit
  return hand.includes(card);
}

/**
 * Determines the winner of a trick
 */
export function getTrickWinner(trick: TrickCard[], leadSuit: Suit): number {
  let winnerIndex = 0;
  let highestValue = -1;

  trick.forEach((trickCard, index) => {
    const { suit, rank } = parseCard(trickCard.card);

    // Only cards matching lead suit can win
    if (suit === leadSuit) {
      const value = RANK_VALUES[rank];
      if (value > highestValue) {
        highestValue = value;
        winnerIndex = index;
      }
    }
  });

  return winnerIndex;
}

/**
 * Calculates penalty points for a trick based on round rules
 */
export function calculateTrickScore(cards: Card[], roundName: RoundName, isLastTrick: boolean): number {
  let score = 0;

  switch (roundName) {
    case 'No Reds':
      // 10 points per red card (Hearts or Diamonds)
      score = cards.filter(card => {
        const { suit } = parseCard(card);
        return suit === 'H' || suit === 'D';
      }).length * 10;
      break;

    case 'No Tricks':
      // 10 points per Heart
      score = cards.filter(card => parseCard(card).suit === 'H').length * 10;
      break;

    case 'No Queens':
      // 100 points per Queen
      score = cards.filter(card => parseCard(card).rank === 'Q').length * 100;
      break;

    case 'No King of Spades':
      // 100 points if King of Spades
      score = cards.some(card => card === 'SK') ? 100 : 0;
      break;

    case 'Last Trick':
      // 100 points for the last trick only
      score = isLastTrick ? 100 : 0;
      break;

    case 'The Salad':
      // All rules combined
      const redCards = cards.filter(card => {
        const { suit } = parseCard(card);
        return suit === 'H' || suit === 'D';
      }).length * 10;

      const hearts = cards.filter(card => parseCard(card).suit === 'H').length * 10;
      const queens = cards.filter(card => parseCard(card).rank === 'Q').length * 100;
      const kingOfSpades = cards.some(card => card === 'SK') ? 100 : 0;
      const lastTrick = isLastTrick ? 100 : 0;

      score = redCards + hearts + queens + kingOfSpades + lastTrick;
      break;
  }

  return score;
}

/**
 * Gets valid cards that can be played from a hand
 */
export function getValidCards(hand: Card[], leadSuit: Suit | null): Card[] {
  if (!leadSuit) {
    return [...hand];
  }

  const cardsOfLeadSuit = hand.filter(card => parseCard(card).suit === leadSuit);

  if (cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit;
  }

  return [...hand];
}

/**
 * Determines if the game is over (all 6 rounds completed)
 */
export function isGameOver(roundNumber: number): boolean {
  return roundNumber > 6;
}

/**
 * Gets the player with the lowest score (winner)
 */
export function getWinner(players: Player[]): Player {
  return players.reduce((lowest, player) =>
    player.score < lowest.score ? player : lowest
  );
}
