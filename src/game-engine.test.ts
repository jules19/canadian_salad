import {
  createDeck,
  dealCards,
  parseCard,
  sortHand,
  canPlayCard,
  getTrickWinner,
  calculateTrickScore,
  getValidCards
} from './game-engine';
import { Card, Suit, TrickCard } from './types';

describe('Game Engine', () => {
  describe('createDeck', () => {
    it('should create a standard 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();
      const hearts = deck.filter(c => c.startsWith('H'));
      const diamonds = deck.filter(c => c.startsWith('D'));
      const clubs = deck.filter(c => c.startsWith('C'));
      const spades = deck.filter(c => c.startsWith('S'));

      expect(hearts).toHaveLength(13);
      expect(diamonds).toHaveLength(13);
      expect(clubs).toHaveLength(13);
      expect(spades).toHaveLength(13);
    });
  });

  describe('dealCards', () => {
    it('should deal equal hands for 4 players', () => {
      const { hands } = dealCards(4);

      expect(hands).toHaveLength(4);
      hands.forEach(hand => {
        expect(hand).toHaveLength(13);
      });
    });

    it('should deal equal hands for 3 players (51 cards)', () => {
      const { hands } = dealCards(3);

      expect(hands).toHaveLength(3);
      hands.forEach(hand => {
        expect(hand).toHaveLength(17);
      });

      // Verify 2 of Diamonds was removed
      const allCards = hands.flat();
      expect(allCards).not.toContain('D2');
      expect(allCards).toHaveLength(51);
    });

    it('should not have duplicate cards', () => {
      const { hands } = dealCards(4);
      const allCards = hands.flat();
      const uniqueCards = new Set(allCards);

      expect(uniqueCards.size).toBe(allCards.length);
    });
  });

  describe('parseCard', () => {
    it('should parse single digit rank cards', () => {
      const { suit, rank } = parseCard('H2');
      expect(suit).toBe('H');
      expect(rank).toBe('2');
    });

    it('should parse face cards', () => {
      const { suit, rank } = parseCard('SK');
      expect(suit).toBe('S');
      expect(rank).toBe('K');
    });

    it('should parse 10 cards', () => {
      const { suit, rank } = parseCard('D10');
      expect(suit).toBe('D');
      expect(rank).toBe('10');
    });
  });

  describe('sortHand', () => {
    it('should sort cards by suit then rank', () => {
      const hand = ['SK', 'H2', 'C3', 'DA', 'H10'];
      const sorted = sortHand(hand);

      expect(sorted[0]).toBe('C3');  // Clubs first
      expect(sorted[1]).toBe('DA');   // Then Diamonds
      expect(sorted[2]).toBe('H2');   // Then Hearts
      expect(sorted[3]).toBe('H10');
      expect(sorted[4]).toBe('SK');   // Then Spades
    });
  });

  describe('canPlayCard', () => {
    it('should allow any card when no lead suit', () => {
      const hand = ['H2', 'D3', 'C4'];
      expect(canPlayCard('H2', hand, null)).toBe(true);
      expect(canPlayCard('D3', hand, null)).toBe(true);
    });

    it('should require following suit if player has it', () => {
      const hand = ['H2', 'H5', 'D3'];
      expect(canPlayCard('H2', hand, 'H')).toBe(true);
      expect(canPlayCard('D3', hand, 'H')).toBe(false);
    });

    it('should allow any card if player does not have lead suit', () => {
      const hand = ['D2', 'D5', 'C3'];
      expect(canPlayCard('D2', hand, 'H')).toBe(true);
      expect(canPlayCard('C3', hand, 'H')).toBe(true);
    });

    it('should return false for cards not in hand', () => {
      const hand = ['H2', 'D3'];
      expect(canPlayCard('SK', hand, null)).toBe(false);
    });
  });

  describe('getTrickWinner', () => {
    it('should find winner based on highest card of lead suit', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: 'H5' },
        { playerId: 'p2', card: 'H10' },
        { playerId: 'p3', card: 'HA' },
        { playerId: 'p4', card: 'H2' }
      ];

      const winner = getTrickWinner(trick, 'H');
      expect(winner).toBe(2); // p3 with Ace
    });

    it('should ignore cards not matching lead suit', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: 'H5' },
        { playerId: 'p2', card: 'SA' }, // Different suit
        { playerId: 'p3', card: 'H10' }
      ];

      const winner = getTrickWinner(trick, 'H');
      expect(winner).toBe(2); // p3 with H10
    });
  });

  describe('calculateTrickScore', () => {
    describe('No Reds', () => {
      it('should count 10 points per red card', () => {
        const cards = ['H2', 'D5', 'C3', 'S4'];
        const score = calculateTrickScore(cards, 'No Reds', false);
        expect(score).toBe(20); // 2 red cards
      });

      it('should return 0 for no red cards', () => {
        const cards = ['C2', 'S5', 'C3'];
        const score = calculateTrickScore(cards, 'No Reds', false);
        expect(score).toBe(0);
      });
    });

    describe('No Tricks', () => {
      it('should count 10 points per Heart', () => {
        const cards = ['H2', 'H5', 'D3', 'C4'];
        const score = calculateTrickScore(cards, 'No Tricks', false);
        expect(score).toBe(20); // 2 Hearts
      });

      it('should not count Diamonds', () => {
        const cards = ['D2', 'D5', 'C3'];
        const score = calculateTrickScore(cards, 'No Tricks', false);
        expect(score).toBe(0);
      });
    });

    describe('No Queens', () => {
      it('should count 100 points per Queen', () => {
        const cards = ['HQ', 'DQ', 'C3'];
        const score = calculateTrickScore(cards, 'No Queens', false);
        expect(score).toBe(200);
      });

      it('should return 0 for no Queens', () => {
        const cards = ['HK', 'D5'];
        const score = calculateTrickScore(cards, 'No Queens', false);
        expect(score).toBe(0);
      });
    });

    describe('No King of Spades', () => {
      it('should count 100 points for King of Spades', () => {
        const cards = ['SK', 'H2', 'D3'];
        const score = calculateTrickScore(cards, 'No King of Spades', false);
        expect(score).toBe(100);
      });

      it('should return 0 for no King of Spades', () => {
        const cards = ['SQ', 'SA', 'H2'];
        const score = calculateTrickScore(cards, 'No King of Spades', false);
        expect(score).toBe(0);
      });
    });

    describe('Last Trick', () => {
      it('should count 100 points for last trick', () => {
        const cards = ['H2', 'D3'];
        const score = calculateTrickScore(cards, 'Last Trick', true);
        expect(score).toBe(100);
      });

      it('should return 0 for non-last tricks', () => {
        const cards = ['H2', 'D3'];
        const score = calculateTrickScore(cards, 'Last Trick', false);
        expect(score).toBe(0);
      });
    });

    describe('The Salad', () => {
      it('should combine all rules', () => {
        const cards = ['HQ', 'D2', 'SK', 'H5'];
        const score = calculateTrickScore(cards, 'The Salad', true);

        // Red cards: 4 * 10 = 40
        // Hearts: 2 * 10 = 20
        // Queens: 1 * 100 = 100
        // King of Spades: 100
        // Last trick: 100
        // Total: 360
        expect(score).toBe(360);
      });
    });
  });

  describe('getValidCards', () => {
    it('should return all cards when no lead suit', () => {
      const hand = ['H2', 'D3', 'C4'];
      const valid = getValidCards(hand, null);
      expect(valid).toEqual(hand);
    });

    it('should return only lead suit cards when available', () => {
      const hand = ['H2', 'H5', 'D3', 'C4'];
      const valid = getValidCards(hand, 'H');
      expect(valid).toEqual(['H2', 'H5']);
    });

    it('should return all cards when lead suit not in hand', () => {
      const hand = ['D2', 'C3', 'S4'];
      const valid = getValidCards(hand, 'H');
      expect(valid).toEqual(hand);
    });
  });
});
