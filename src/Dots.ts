import Edge from "./Edge";
import { GameConstants } from "./GameConstants";
import Grid from "./Grid";
import Point from "./Point";
import { Coord, MoveResult } from "./types";

class Score {
    player1: number = 0;
    player2: number = 0;
}

class Dots {
    public grid: Grid;
    score: Score = new Score();
    status: number = GameConstants.STATUS_NOT_INITIATED;
    playHistory: Edge[] = [];

    constructor(gridsize: number) {
        this.grid = new Grid(gridsize);
    }

    /**
     * Connect two adjacent dots, drawing the edge between them.
     *
     * A move is always an edge (two dots); collecting the two endpoints — e.g.
     * the two-click selection in a UI — is the caller's responsibility, so the
     * engine stays stateless about selection and receives one complete move.
     *
     * @param from Start dot as `[x, y]` (x = column, y = row, 0-based).
     * @param to   End dot as `[x, y]`; must be orthogonally adjacent to `from`.
     * @returns A {@link MoveResult} describing the outcome of the move.
     * @throws If the game is over, a coordinate is out of bounds, or the two
     *         dots are not adjacent.
     */
    play(from: Coord, to: Coord): MoveResult {
        if (this.isOVer()) {
            throw new Error("Game is over");
        }

        const edge = this.buildEdge(from, to);

        const player = this.getTurn();
        const squaresClosed = this.grid.conquerEdge(edge, player.toString());

        this.updateScore(player, squaresClosed);
        this.playHistory.push(edge);
        this.updateStatus();

        return {
            squaresClosed,
            scoredBy: player,
            nextTurn: this.getTurn(),
            status: this.status,
        };
    }

    /**
     * Build the edge for a move, validating it first. Single source of truth
     * for move validation: bounds + orthogonal adjacency.
     */
    private buildEdge(from: Coord, to: Coord): Edge {
        const size = this.grid.size;
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

    getTurn() {
        const moves = this.playHistory.length;
        return (moves % 2);
    }

    getScore() {
        return this.score;
    }

    isOVer() {
        return this.status === GameConstants.STATUS_OVER ||
            this.status === GameConstants.STATUS_OVER_BY_DRAW;
    }

    isDraw() {
        return this.score.player1 === this.score.player2;
    }

    private updateScore(player: number, nClosedSquares: number) {
        if (player === GameConstants.PLAYER1) {
            this.score.player1 += nClosedSquares;
        } else {
            this.score.player2 += nClosedSquares;
        }
    }

    private updateStatus() {
        if (!this.grid.hasOpenSquare()) {
            if (this.score.player1 === this.score.player2) {
                this.status = GameConstants.STATUS_OVER_BY_DRAW;
            } else {
                this.status = GameConstants.STATUS_OVER;
            }
        } else {
            this.status = GameConstants.STATUS_IN_PROGRESS;
        }
    }
}
export default Dots;
