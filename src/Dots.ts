import Edge from "./Edge";
import { GameConstants } from "./GameConstants";
import Grid from "./Grid";
import { Coord, MoveResult } from "./types";

class Dots {
    public grid: Grid;
    /** Squares closed per submitter EOA address. JSON-serializable by design. */
    scores: Record<string, number> = {};
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
     * This is a free-for-all: any `submitter` may draw any open edge, and any
     * square the move closes is owned by that submitter.
     *
     * @param from Start dot as `[x, y]` (x = column, y = row, 0-based).
     * @param to   End dot as `[x, y]`; must be orthogonally adjacent to `from`.
     * @param submitter EOA address drawing the edge; owns any squares it closes.
     * @returns A {@link MoveResult} describing the outcome of the move.
     * @throws If the game is over, a coordinate is out of bounds, the two
     *         dots are not adjacent, or the edge has already been drawn.
     */
    play(from: Coord, to: Coord, submitter: string): MoveResult {
        if (this.isOVer()) {
            throw new Error("Game is over");
        }

        const edge = this.grid.buildEdge(from, to);

        if (this.grid.isEdgeDrawn(edge)) {
            const [x1, y1] = from;
            const [x2, y2] = to;
            throw new Error(`Edge already drawn: [${x1}, ${y1}] -> [${x2}, ${y2}]`);
        }

        const squaresClosed = this.grid.conquerEdge(edge, submitter);

        if (squaresClosed > 0) {
            this.addScore(submitter, squaresClosed);
        }
        this.playHistory.push(edge);
        this.updateStatus();

        return {
            squaresClosed,
            submitter,
            status: this.status,
        };
    }

    getScore() {
        return this.scores;
    }

    isOVer() {
        return this.status === GameConstants.STATUS_OVER ||
            this.status === GameConstants.STATUS_OVER_BY_DRAW;
    }

    isDraw() {
        return this.isOVer() && this.getWinner() === null;
    }

    /**
     * The submitter who owns the most closed squares, or `null` when the top
     * count is shared by two or more addresses (a draw).
     */
    getWinner(): string | null {
        let winner: string | null = null;
        let topScore = 0;
        let tied = false;

        for (const [address, score] of Object.entries(this.scores)) {
            if (score > topScore) {
                topScore = score;
                winner = address;
                tied = false;
            } else if (score === topScore) {
                tied = true;
            }
        }

        return tied ? null : winner;
    }

    private addScore(submitter: string, nClosedSquares: number) {
        this.scores[submitter] = (this.scores[submitter] ?? 0) + nClosedSquares;
    }

    private updateStatus() {
        if (!this.grid.hasOpenSquare()) {
            this.status = this.getWinner() !== null
                ? GameConstants.STATUS_OVER
                : GameConstants.STATUS_OVER_BY_DRAW;
        } else {
            this.status = GameConstants.STATUS_IN_PROGRESS;
        }
    }
}
export default Dots;
