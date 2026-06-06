import Dots from "../src/Dots";
import { GameConstants } from "../src/GameConstants";

const ALICE = "0xAl1ce";
const BOB = "0xB0b";

describe("Dots.play", () => {
  it("accepts a move as two coordinate tuples and records it", () => {
    const dots = new Dots(3);
    const result = dots.play([0, 0], [0, 1], ALICE);

    expect(result.squaresClosed).toBe(0);
    expect(result.submitter).toBe(ALICE);
    expect(result.status).toBe(GameConstants.STATUS_IN_PROGRESS);
    expect(dots.playHistory.length).toBe(1);
  });

  it("credits the closed square to its submitter and ends the game", () => {
    const dots = new Dots(2); // a single square
    expect(dots.play([0, 0], [0, 1], ALICE).squaresClosed).toBe(0);
    expect(dots.play([0, 1], [1, 1], BOB).squaresClosed).toBe(0);
    expect(dots.play([1, 1], [1, 0], ALICE).squaresClosed).toBe(0);

    const closing = dots.play([1, 0], [0, 0], BOB); // BOB closes the square
    expect(closing.squaresClosed).toBe(1);
    expect(closing.submitter).toBe(BOB);
    expect(closing.status).toBe(GameConstants.STATUS_OVER);
    expect(dots.isOVer()).toBe(true);
    expect(dots.isDraw()).toBe(false);
    expect(dots.getWinner()).toBe(BOB);
    expect(dots.getScore()).toEqual({ [BOB]: 1 });
    expect(dots.grid.squares[0].owner).toBe(BOB);
  });

  it("tallies squares per address across multiple submitters", () => {
    const dots = new Dots(3); // 2x2 = 4 squares

    // Close square 0 (top-left) -> ALICE
    dots.play([0, 0], [1, 0], ALICE);
    dots.play([0, 0], [0, 1], ALICE);
    dots.play([0, 1], [1, 1], ALICE);
    expect(dots.play([1, 0], [1, 1], ALICE).squaresClosed).toBe(1);

    // Close square 1 (top-right) -> BOB
    dots.play([1, 0], [2, 0], BOB);
    dots.play([2, 0], [2, 1], BOB);
    expect(dots.play([1, 1], [2, 1], BOB).squaresClosed).toBe(1);

    expect(dots.getScore()).toEqual({ [ALICE]: 1, [BOB]: 1 });
  });

  it("ends in a draw when the top square count is tied", () => {
    const dots = new Dots(3); // 2x2 = 4 squares

    // Square 0 -> ALICE
    dots.play([0, 0], [1, 0], ALICE);
    dots.play([0, 0], [0, 1], ALICE);
    dots.play([0, 1], [1, 1], ALICE);
    dots.play([1, 0], [1, 1], ALICE); // closes square 0

    // Square 1 -> BOB
    dots.play([1, 0], [2, 0], BOB);
    dots.play([2, 0], [2, 1], BOB);
    dots.play([1, 1], [2, 1], BOB); // closes square 1

    // Square 2 -> ALICE
    dots.play([0, 1], [0, 2], ALICE);
    dots.play([0, 2], [1, 2], ALICE);
    dots.play([1, 1], [1, 2], ALICE); // closes square 2

    // Square 3 -> BOB (final move, fills the grid)
    dots.play([2, 1], [2, 2], BOB);
    const closing = dots.play([1, 2], [2, 2], BOB); // closes square 3

    expect(closing.status).toBe(GameConstants.STATUS_OVER_BY_DRAW);
    expect(dots.getScore()).toEqual({ [ALICE]: 2, [BOB]: 2 });
    expect(dots.getWinner()).toBeNull();
    expect(dots.isDraw()).toBe(true);
  });

  it("throws when a coordinate is out of bounds", () => {
    const dots = new Dots(3);
    expect(() => dots.play([0, 0], [0, 3], ALICE)).toThrow(/out of bounds/);
    expect(() => dots.play([-1, 0], [0, 0], ALICE)).toThrow(/out of bounds/);
  });

  it("throws when the two dots are not adjacent", () => {
    const dots = new Dots(3);
    expect(() => dots.play([0, 0], [1, 1], ALICE)).toThrow(/adjacent/);
    expect(() => dots.play([0, 0], [0, 2], ALICE)).toThrow(/adjacent/);
  });

  it("rejects an already-drawn edge without mutating state", () => {
    const dots = new Dots(3);
    dots.play([0, 0], [0, 1], ALICE);

    expect(() => dots.play([0, 0], [0, 1], BOB)).toThrow(/already drawn/);
    // reversed orientation is the same edge -> also rejected
    expect(() => dots.play([0, 1], [0, 0], BOB)).toThrow(/already drawn/);

    // no state change: history length unchanged, no score for BOB
    expect(dots.playHistory.length).toBe(1);
    expect(dots.getScore()).toEqual({});
  });

  it("throws when playing after the game is over", () => {
    const dots = new Dots(2);
    dots.play([0, 0], [0, 1], ALICE);
    dots.play([0, 1], [1, 1], BOB);
    dots.play([1, 1], [1, 0], ALICE);
    dots.play([1, 0], [0, 0], BOB); // closes the only square -> game over
    expect(() => dots.play([0, 0], [1, 0], ALICE)).toThrow("Game is over");
  });
});
