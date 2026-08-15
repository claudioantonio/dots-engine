import { normalizePlayerId } from "./address";
import { GameConstants } from "./GameConstants";
import Grid from "./Grid";
import { Coord, MatchId, MoveRecord, MoveResult, PlayerId } from "./types";

class Dots {
    public grid: Grid;
    /** Identifier of this match; stamped onto every {@link MoveRecord}. */
    public matchId: MatchId;
    /** The two players in this match; `players[0]` moves first. */
    public players: [PlayerId, PlayerId];
    /** Player allowed to submit the next move. */
    public turn: PlayerId;
    /** Squares closed per submitter. JSON-serializable by design. */
    scores: Record<PlayerId, number> = {};
    status: number = GameConstants.STATUS_NOT_INITIATED;
    /** Full move history — simultaneously the per-move notice payload and the replay input (F6). */
    moveLog: MoveRecord[] = [];

    /**
     * @param matchId Identifier of this match, assigned by the caller
     *        (today: tests; later: the Match orchestrator).
     * @param players The two players, normalized on entry; `players[0]`
     *        moves first (the first joiner, per the matchmaking queue).
     * @throws If the two players are not distinct once normalized.
     */
    constructor(gridsize: number, players: [string, string], matchId: MatchId) {
        this.grid = new Grid(gridsize);
        this.matchId = matchId;

        const p1 = normalizePlayerId(players[0]);
        const p2 = normalizePlayerId(players[1]);
        if (p1 === p2) {
            throw new Error(`A match needs two distinct players, got the same player twice: ${p1}`);
        }
        this.players = [p1, p2];
        this.turn = p1;
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
     * Extra move on close: a move that closes one or two squares keeps the
     * turn with the same player instead of alternating (PRD-v5 §6.4).
     *
     * @param from Start dot as `[x, y]` (x = column, y = row, 0-based).
     * @param to   End dot as `[x, y]`; must be orthogonally adjacent to `from`.
     * @param submitter Identifier of the player drawing the edge; owns any
     *        squares it closes. Normalized before use, so formatting
     *        differences never affect scoring or the returned `MoveResult`.
     * @param timestamp Input-metadata timestamp of this move (never
     *        wall-clock); stamped onto the resulting `MoveRecord`.
     * @returns A {@link MoveResult} describing the outcome of the move.
     * @throws If the game is over, `submitter` is not the player on turn, a
     *         coordinate is out of bounds, the two dots are not adjacent, or
     *         the edge has already been drawn.
     */
    play(from: Coord, to: Coord, submitter: string, timestamp: number): MoveResult {
        if (this.isOVer()) {
            throw new Error("Game is over");
        }

        submitter = normalizePlayerId(submitter);

        if (submitter !== this.turn) {
            throw new Error(`Not this player's turn: expected ${this.turn}, got ${submitter}`);
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
        this.updateStatus();
        if (squaresClosed === 0) {
            this.turn = this.otherPlayer(submitter);
        }

        this.moveLog.push({
            matchId: this.matchId,
            moveIndex: this.moveLog.length,
            edge: [from, to],
            submitter,
            squaresClosed,
            turnAfter: this.turn,
            timestamp,
        });

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
    getWinner(): PlayerId | null {
        let winner: PlayerId | null = null;
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

    private addScore(submitter: PlayerId, nClosedSquares: number) {
        this.scores[submitter] = (this.scores[submitter] ?? 0) + nClosedSquares;
    }

    private otherPlayer(player: PlayerId): PlayerId {
        return this.players[0] === player ? this.players[1] : this.players[0];
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
