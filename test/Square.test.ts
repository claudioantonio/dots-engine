import Square from '../src/Square';
import Edge from '../src/Edge';
import Point from '../src/Point';

function makeEdges(): Edge[] {
  return [
    new Edge(new Point(0, 0), new Point(0, 1)),
    new Edge(new Point(0, 1), new Point(1, 1)),
    new Edge(new Point(1, 1), new Point(1, 0)),
    new Edge(new Point(1, 0), new Point(0, 0)),
  ];
}

describe('Square', () => {
  it('throws unless it is given exactly 4 edges', () => {
    expect(() => new Square(0, makeEdges().slice(0, 3))).toThrow(
      'Edge array must have exactly 4 edges'
    );
  });

  it('registers itself on each of its edges', () => {
    const edges = makeEdges();
    new Square(5, edges);
    edges.forEach(edge => expect(edge.relatedSquareId).toContain(5));
  });

  describe('hasAvailableFace / getNumberOfAvailableFaces', () => {
    it('starts with all 4 faces available', () => {
      const square = new Square(0, makeEdges());
      expect(square.hasAvailableFace()).toBe(true);
      expect(square.getNumberOfAvailableFaces()).toBe(4);
    });

    it('counts down as edges are claimed', () => {
      const edges = makeEdges();
      const square = new Square(0, edges);
      edges[0].setOwner('player1');
      expect(square.getNumberOfAvailableFaces()).toBe(3);
      expect(square.hasAvailableFace()).toBe(true);
    });

    it('has no available face once every edge is claimed', () => {
      const edges = makeEdges();
      const square = new Square(0, edges);
      edges.forEach(edge => edge.setOwner('player1'));
      expect(square.hasAvailableFace()).toBe(false);
      expect(square.getNumberOfAvailableFaces()).toBe(0);
    });
  });

  describe('hasOwner', () => {
    it('is false until an owner is assigned', () => {
      const square = new Square(0, makeEdges());
      expect(square.hasOwner()).toBe(false);
    });

    it('is true once an owner is assigned', () => {
      const square = new Square(0, makeEdges());
      square.owner = 'player1';
      expect(square.hasOwner()).toBe(true);
    });

    it('is false if owner is ever unset (defensive optional-chaining path)', () => {
      const square = new Square(0, makeEdges());
      (square as unknown as { owner: undefined }).owner = undefined;
      expect(square.hasOwner()).toBe(false);
    });
  });
});
