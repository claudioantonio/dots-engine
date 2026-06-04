import Grid from '../src/Grid';
import Point from '../src/Point';
import Edge from '../src/Edge';

describe('Grid', () => {
  describe('constructor', () => {
    it('should throw an error if gridSize is less than 2', () => {
      expect(() => new Grid(1)).toThrow('Grid size must be greater or equal to 2');
    });

    it('should create the correct number of grid points and squares', () => {
      const grid = new Grid(3);
      expect(grid.points.length).toBe(9);
      expect(grid.squares.length).toBe(4);
    });
  });

  describe('createSquares', () => {
    it('should create the correct number of unique edges', () => {
      const grid = new Grid(3);
      expect(grid.uniqueEdges.length).toBe(12);
    });
  });

  describe('findEdge', () => {
    it('should return the shared edge instance for two adjacent points', () => {
      const grid = new Grid(4);
      const edge = grid.findEdge(new Point(0, 0), new Point(0, 1));
      expect(edge).not.toBeNull();
      expect(edge!.p1).toEqual(new Point(0, 0));
      expect(edge!.p2).toEqual(new Point(0, 1));
    });
  });

  describe('conquerEdge', () => {
    it('should return the correct number of closed squares', () => {
      const grid = new Grid(4);
      let nClosedSquares = 0;
      nClosedSquares += grid.conquerEdge(new Edge(new Point(0, 0), new Point(0, 1)), 'player1');
      nClosedSquares += grid.conquerEdge(new Edge(new Point(0, 1), new Point(1, 1)), 'player1');
      nClosedSquares += grid.conquerEdge(new Edge(new Point(1, 1), new Point(1, 0)), 'player1');
      nClosedSquares += grid.conquerEdge(new Edge(new Point(1, 0), new Point(0, 0)), 'player1');
      expect(nClosedSquares).toBe(1);
      expect(grid.squares[0].owner).toBe('player1');
    });
  });

  describe('hasOpenSquare', () => {
    it('should return true if there is an open square', () => {
      const grid = new Grid(2);
      expect(grid.hasOpenSquare()).toBe(true);
    });

    it('should return false if there are no open squares', () => {
      const grid = new Grid(2);
      grid.conquerEdge(new Edge(new Point(0, 0), new Point(0, 1)), 'player1');
      grid.conquerEdge(new Edge(new Point(0, 1), new Point(1, 1)), 'player1');
      grid.conquerEdge(new Edge(new Point(1, 1), new Point(1, 0)), 'player1');
      grid.conquerEdge(new Edge(new Point(1, 0), new Point(0, 0)), 'player1');
      expect(grid.hasOpenSquare()).toBe(false);
    });
  });
});
