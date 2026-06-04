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
 * Outcome of a single {@link Dots.play} call — everything a UI needs to
 * re-render after a move, returned from the one call instead of forcing the
 * caller to diff `getScore()` / `getTurn()` / `isOVer()` by hand.
 */
export interface MoveResult {
    /** Squares completed by this move (0, 1, or 2). */
    squaresClosed: number;
    /** Player who made the move (`0` = player 1, `1` = player 2). */
    scoredBy: number;
    /** Player whose turn it is now. */
    nextTurn: number;
    /** Game status after the move (see `GameConstants.STATUS_*`). */
    status: number;
}
