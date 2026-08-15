/**
 * A dot on the grid, expressed as `[x, y]` where `x` is the column and `y` the
 * row (both 0-based). Ranges from `[0, 0]` to `[gridSize - 1, gridSize - 1]`.
 *
 * Plain tuples are intentionally the only move vocabulary: they are
 * JSON-serializable and need no engine-internal classes, so the same `Coord`
 * type can describe a frontend's state and feed {@link Dots.play} directly.
 */
export type Coord = [number, number];

/**
 * A player identifier, already normalized by the engine at every ingress so
 * the same player never forks into separate score buckets. Opaque to game
 * logic — see {@link ../address.normalizePlayerId} for the one place that
 * knows its concrete format.
 */
export type PlayerId = string;

/**
 * A match identifier, opaque to game logic. Assigned once per match by
 * whoever constructs the engine (today: tests; later: the Match
 * orchestrator).
 */
export type MatchId = string;

/**
 * One applied move, in canonical form. Doubles as the per-move notice
 * payload (F6) and, as a log, the replay input — the shape is shared on
 * purpose so the two never drift.
 */
export interface MoveRecord {
    matchId: MatchId;
    /** 0-based position of this move within the match's move log. */
    moveIndex: number;
    /** The move exactly as submitted: `[from, to]`. */
    edge: [Coord, Coord];
    /** Identifier of the player who submitted this move; already normalized. */
    submitter: PlayerId;
    /** Squares completed by this move (0, 1, or 2). */
    squaresClosed: number;
    /** Player on turn immediately after this move resolved. */
    turnAfter: PlayerId;
    /** Input-metadata timestamp of this move (never wall-clock). */
    timestamp: number;
}

/**
 * Outcome of a single {@link Dots.play} call — everything a UI needs to
 * re-render after a move, returned from the one call instead of forcing the
 * caller to diff `getScore()` / `isOVer()` by hand.
 */
export interface MoveResult {
    /** Squares completed by this move (0, 1, or 2). */
    squaresClosed: number;
    /** Identifier of the player who submitted this move (owns any squares it closed); already normalized. */
    submitter: PlayerId;
    /** Game status after the move (see `GameConstants.STATUS_*`). */
    status: number;
}
