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

    it('should return null for an edge that is not part of the grid', () => {
      const grid = new Grid(3);
      expect(grid.findEdge(new Point(0, 0), new Point(2, 2))).toBeNull();
    });
  });

  describe('getSquarePosition / getSquareId', () => {
    it('should map square ids to their [row, col] position and back', () => {
      const grid = new Grid(3); // 2x2 squares

      expect(grid.getSquarePosition(0)).toEqual([0, 0]);
      expect(grid.getSquarePosition(1)).toEqual([0, 1]);
      expect(grid.getSquarePosition(2)).toEqual([1, 0]);
      expect(grid.getSquarePosition(3)).toEqual([1, 1]);

      for (let id = 0; id < grid.squares.length; id++) {
        const [row, col] = grid.getSquarePosition(id);
        expect(grid.getSquareId(row, col)).toBe(id);
      }
    });
  });

  describe('getSquaresForEdge', () => {
    it('should return both square ids that share an interior edge', () => {
      const grid = new Grid(3); // 2x2 squares: 0 top-left, 1 top-right
      const sharedEdge = grid.findEdge(new Point(1, 0), new Point(1, 1))!;
      expect(grid.getSquaresForEdge(sharedEdge).slice().sort()).toEqual([0, 1]);
    });

    it('should return a single square id for a border edge', () => {
      const grid = new Grid(3);
      const borderEdge = grid.findEdge(new Point(0, 0), new Point(0, 1))!;
      expect(grid.getSquaresForEdge(borderEdge)).toEqual([0]);
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

  describe('isEdgeDrawn', () => {
    it('should return false for an edge that is not tracked by the grid', () => {
      const grid = new Grid(3);
      const untrackedEdge = new Edge(new Point(0, 0), new Point(2, 2));
      expect(grid.isEdgeDrawn(untrackedEdge)).toBe(false);
    });

    it('should return true only once the tracked edge has an owner', () => {
      const grid = new Grid(3);
      const edge = new Edge(new Point(0, 0), new Point(0, 1));
      expect(grid.isEdgeDrawn(edge)).toBe(false);
      grid.conquerEdge(edge, 'player1');
      expect(grid.isEdgeDrawn(edge)).toBe(true);
    });
  });

  describe('raw getters', () => {
    it('getSquares/getEdges/getPoints should expose the underlying arrays', () => {
      const grid = new Grid(3);
      expect(grid.getSquares()).toBe(grid.squares);
      expect(grid.getEdges()).toBe(grid.uniqueEdges);
      expect(grid.getPoints()).toBe(grid.points);
    });
  });
});
