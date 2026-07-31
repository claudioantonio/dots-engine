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
