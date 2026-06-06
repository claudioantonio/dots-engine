import Square from './Square';
import Point from './Point';
import Edge from './Edge';
import { Coord } from './types';

class Grid {
    size: number;
    squares: Square[] = [];
    points: Point[] = [];
    uniqueEdges: Edge[] = [];
    
    /**
     * Constructor
     * @param gridSize n. points (horizontal and vertical) for the grid
     */
    constructor(gridSize: number) {
        if (gridSize < 2) throw new Error("Grid size must be greater or equal to 2");
        this.size = gridSize;
        this.build(gridSize);
    }

    private build(gridSize: number) {
        this.createPoints(gridSize);
        this.createSquares(gridSize);
    }

    private createPoints(gridSize: number) {
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                this.points.push(new Point(x, y));
            }
        }
    }

    private createSquares(gridSize: number) {
        const squaresPerRow = gridSize - 1;
        const totalRows = gridSize - 1;
        
        for (let row = 0; row < totalRows; row++) {
            for (let col = 0; col < squaresPerRow; col++) {
                const squareId = row * squaresPerRow + col;
                console.log('CreateSquare #' + squareId + ' at position (' + row + ',' + col + ')');
                let edges: Edge[] = this.createEdges(row, col, gridSize);
                this.squares.push(
                    new Square(squareId, edges)
                );
            }
        }
        console.log('createSquares - created #uniqueEdges=' + this.uniqueEdges.length);
    }

    private createEdges(row: number, col: number, gridSize: number) {
        // Create the four edges for a square at position (row, col)
        // Each edge connects two adjacent points
        let leftEdge: Edge = this.getEdge(
            new Point(col, row),
            new Point(col, row + 1)
        );
        let bottomEdge: Edge = this.getEdge(
            new Point(col, row + 1),
            new Point(col + 1, row + 1)
        );
        let rightEdge: Edge = this.getEdge(
            new Point(col + 1, row + 1),
            new Point(col + 1, row)
        );
        let topEdge: Edge = this.getEdge(
            new Point(col + 1, row),
            new Point(col, row)
        );
        
        let edges: Edge[] = [leftEdge, bottomEdge, rightEdge, topEdge];
        return edges;
    }

    private getEdge(p1: Point, p2: Point): Edge {
        let tempEdge: Edge = new Edge(p1, p2);
        for (let i = 0; i < this.uniqueEdges.length; i++) {
            const existingEdge = this.uniqueEdges[i];
            if (existingEdge.equals(tempEdge)) {
                return existingEdge;
            }
        }
        this.uniqueEdges.push(tempEdge);
        return tempEdge;
    }

    /**
     * Get square position from square ID
     * @param squareId The square ID
     * @returns [row, col] position
     */
    public getSquarePosition(squareId: number): [number, number] {
        const squaresPerRow = this.size - 1;
        const row = Math.floor(squareId / squaresPerRow);
        const col = squareId % squaresPerRow;
        return [row, col];
    }

    /**
     * Get square ID from position
     * @param row Row position
     * @param col Column position
     * @returns Square ID
     */
    public getSquareId(row: number, col: number): number {
        const squaresPerRow = this.size - 1;
        return row * squaresPerRow + col;
    }

    /**
     * Get all squares that share an edge
     * @param edge The edge
     * @returns Array of square IDs that share this edge
     */
    public getSquaresForEdge(edge: Edge): number[] {
        return edge.relatedSquareId;
    }

    /**
     * Build the edge for a move, validating it first. Single source of truth
     * for move geometry: bounds + orthogonal adjacency.
     */
    public buildEdge(from: Coord, to: Coord): Edge {
        const size = this.size;
        const endpoints: [string, Coord][] = [["from", from], ["to", to]];

        for (const [label, [x, y]] of endpoints) {
            if (!Number.isInteger(x) || !Number.isInteger(y) ||
                x < 0 || x >= size || y < 0 || y >= size) {
                throw new Error(
                    `Invalid "${label}" coordinate [${x}, ${y}]: out of bounds for a ${size}x${size} grid`
                );
            }
        }

        const [x1, y1] = from;
        const [x2, y2] = to;
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
            throw new Error(
                `Dots must be adjacent: [${x1}, ${y1}] -> [${x2}, ${y2}]`
            );
        }

        return new Edge(new Point(x1, y1), new Point(x2, y2));
    }

    /**
     * Whether the given edge has already been drawn (claimed by a submitter).
     */
    public isEdgeDrawn(edge: Edge): boolean {
        const tracked = this.findEdge(edge.p1, edge.p2);
        return tracked?.hasOwner() ?? false;
    }

    /**
     * Find an edge by its points
     * @param p1 First point
     * @param p2 Second point
     * @returns The edge if found, null otherwise
     */
    public findEdge(p1: Point, p2: Point): Edge | null {
        const searchEdge = new Edge(p1, p2);
        for (let edge of this.uniqueEdges) {
            if (edge.equals(searchEdge)) {
                return edge;
            }
        }
        return null;
    }

    /**
     * Rebuild the board game
     * Useful to restart a game or start a new game.
     * 
     * @param gridSize Number of vertical and horizontal points in grid
     */
    public reset(gridSize: number) {
        this.squares = [];
        this.points = [];
        this.uniqueEdges = [];
        this.build(gridSize);
    }

    /**
     * Get squares that still have available edges
     * @param squareIds List of squares' ids
     */
    private getAvailableSquaresbyId(squareIds: number[]): Square[] {
        let squaresFound: Square[] = [];
        for (let i = 0; i < this.squares.length; i++) {
            const currSquare = this.squares[i];
            squareIds.forEach(id => {
                if ((currSquare.id === id) && (currSquare.hasAvailableFace())) {
                    squaresFound.push(currSquare);
                }
            });
            if (currSquare.id > squareIds[squareIds.length - 1]) break;
        }
        return squaresFound;
    }

    /**
     * Close an edge
     *  
     * @param edge Edge to close 
     * @param owner User who wants to own the edge
     * 
     * @returns Number of closed squares by closing the edge provided.
     */
    public conquerEdge(edge: Edge, owner: string) {
        let nClosedSquares: number = 0;
        for (let i = 0; i < this.uniqueEdges.length; i++) {
            const gameEdge = this.uniqueEdges[i];
            if ((gameEdge.equals(edge)) && (!gameEdge.hasOwner())) {
                let squareIds: number[] = gameEdge.relatedSquareId;
                let availSquaresBeforeClosing: Square[] = this.getAvailableSquaresbyId(squareIds);
                gameEdge.setOwner(owner);
                let availSquaresAfterClosing: Square[] = this.getAvailableSquaresbyId(squareIds);
                nClosedSquares = availSquaresBeforeClosing.length - availSquaresAfterClosing.length;

                if (nClosedSquares > 0) {
                    this.conquerSquare(availSquaresBeforeClosing, availSquaresAfterClosing, owner);
                }

                break;
            }
        }
        return nClosedSquares;
    }

    private conquerSquare(availSquaresBeforeClosing: Square[], availSquaresAfterClosing: Square[], owner: string) {
        for (let i = 0; i < availSquaresBeforeClosing.length; i++) {
            let foundSquare: boolean = false;
            for (let j = 0; j < availSquaresAfterClosing.length; j++) {
                if (availSquaresBeforeClosing[i].id === availSquaresAfterClosing[j].id) {
                    foundSquare = true;
                    break;
                }
            }
            if (!foundSquare) {
                availSquaresBeforeClosing[i].owner = owner;
            }
        }
    }

    /**
     * Check if there is any open square.
     */
    hasOpenSquare() {
        for (let i = 0; i < this.squares.length; i++) {
            if (this.squares[i].hasAvailableFace()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all squares
     */
    getSquares() {
        return this.squares;
    }

    /**
     * Get all edges
     */
    getEdges() {
        return this.uniqueEdges;
    }

    /**
     * Get all points
     */
    getPoints() {
        return this.points;
    }
}

export default Grid;