import Edge from '../src/Edge';
import Point from '../src/Point';

describe('Edge', () => {
  it('stores its two endpoints', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(0, 1);
    const edge = new Edge(p1, p2);
    expect(edge.p1).toBe(p1);
    expect(edge.p2).toBe(p2);
  });

  describe('hasOwner / setOwner', () => {
    it('has no owner by default', () => {
      const edge = new Edge(new Point(0, 0), new Point(0, 1));
      expect(edge.hasOwner()).toBe(false);
    });

    it('assigns the owner the first time it is set', () => {
      const edge = new Edge(new Point(0, 0), new Point(0, 1));
      edge.setOwner('player1');
      expect(edge.hasOwner()).toBe(true);
      expect(edge.owner).toBe('player1');
    });

    it('keeps the first owner once set (an edge cannot be re-owned)', () => {
      const edge = new Edge(new Point(0, 0), new Point(0, 1));
      edge.setOwner('player1');
      edge.setOwner('player2');
      expect(edge.owner).toBe('player1');
    });
  });

  describe('equals', () => {
    it('matches identical endpoints in the same order', () => {
      const a = new Edge(new Point(0, 0), new Point(0, 1));
      const b = new Edge(new Point(0, 0), new Point(0, 1));
      expect(a.equals(b)).toBe(true);
    });

    it('matches identical endpoints in reversed order', () => {
      const a = new Edge(new Point(0, 0), new Point(0, 1));
      const b = new Edge(new Point(0, 1), new Point(0, 0));
      expect(a.equals(b)).toBe(true);
    });

    it('does not match a different edge', () => {
      const a = new Edge(new Point(0, 0), new Point(0, 1));
      const b = new Edge(new Point(1, 0), new Point(1, 1));
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('relatesTo / getRelatedSquareOtherThan', () => {
    it('returns whichever related square id is not the one given', () => {
      const edge = new Edge(new Point(0, 0), new Point(0, 1));
      edge.relatesTo(0);
      edge.relatesTo(1);
      expect(edge.getRelatedSquareOtherThan(0)).toBe(1);
      expect(edge.getRelatedSquareOtherThan(1)).toBe(0);
    });
  });
});
