import Dots from "../src/Dots";
import { GameConstants } from "../src/GameConstants";

const ALICE = "0xal1ce";
const BOB = "0xb0b";

describe("Dots.play", () => {
  it("accepts a move as two coordinate tuples and records it", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    const result = dots.play([0, 0], [0, 1], ALICE);

    expect(result.squaresClosed).toBe(0);
    expect(result.submitter).toBe(ALICE);
    expect(result.status).toBe(GameConstants.STATUS_IN_PROGRESS);
    expect(dots.playHistory.length).toBe(1);
  });

  it("credits the closed square to its submitter and ends the game", () => {
    const dots = new Dots(2, [ALICE, BOB]); // a single square
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

  it("normalizes submitter casing so the same player collapses to one score bucket", () => {
    const ALICE_LOWER = ALICE.toLowerCase();
    const ALICE_UPPER = ALICE.toUpperCase();
    // BOB moves first so ALICE (players[1]) closes the square on her second turn.
    const dots = new Dots(2, [BOB, ALICE_LOWER]);

    dots.play([0, 0], [0, 1], BOB);
    dots.play([0, 1], [1, 1], ALICE_UPPER); // accepted: normalizes to the same turn as ALICE_LOWER
    dots.play([1, 1], [1, 0], BOB);
    const closing = dots.play([1, 0], [0, 0], ALICE_LOWER); // closes the square

    expect(closing.submitter).toBe(ALICE_LOWER);
    expect(dots.getScore()).toEqual({ [ALICE_LOWER]: 1 });
    expect(dots.grid.squares[0].owner).toBe(ALICE_LOWER);
  });

  it("tallies squares per address across multiple submitters", () => {
    const dots = new Dots(3, [ALICE, BOB]); // 2x2 = 4 squares

    // Square 0 (top-left) and square 3 (bottom-right) share no edge, so ALICE
    // and BOB can each close one on their own turns while strictly alternating.
    expect(dots.play([0, 0], [0, 1], ALICE).squaresClosed).toBe(0); // sq0
    expect(dots.play([1, 1], [1, 2], BOB).squaresClosed).toBe(0); // sq3
    expect(dots.play([0, 1], [1, 1], ALICE).squaresClosed).toBe(0); // sq0
    expect(dots.play([1, 2], [2, 2], BOB).squaresClosed).toBe(0); // sq3
    expect(dots.play([1, 1], [1, 0], ALICE).squaresClosed).toBe(0); // sq0
    expect(dots.play([2, 2], [2, 1], BOB).squaresClosed).toBe(0); // sq3
    expect(dots.play([1, 0], [0, 0], ALICE).squaresClosed).toBe(1); // closes sq0
    expect(dots.play([2, 1], [1, 1], BOB).squaresClosed).toBe(1); // closes sq3

    expect(dots.getScore()).toEqual({ [ALICE]: 1, [BOB]: 1 });
  });

  it("ends in a draw when the top square count is tied", () => {
    const dots = new Dots(3, [ALICE, BOB]); // 2x2 = 4 squares

    dots.play([0, 0], [0, 1], ALICE);
    dots.play([1, 0], [2, 0], BOB);
    dots.play([0, 0], [1, 0], ALICE);
    dots.play([2, 0], [2, 1], BOB);
    dots.play([1, 0], [1, 1], ALICE);
    expect(dots.play([1, 1], [2, 1], BOB).squaresClosed).toBe(1); // closes sq1 -> BOB
    expect(dots.play([0, 1], [1, 1], ALICE).squaresClosed).toBe(1); // closes sq0 -> ALICE
    dots.play([1, 1], [1, 2], BOB);
    dots.play([0, 2], [1, 2], ALICE);
    dots.play([1, 2], [2, 2], BOB);
    expect(dots.play([0, 1], [0, 2], ALICE).squaresClosed).toBe(1); // closes sq2 -> ALICE
    const closing = dots.play([2, 1], [2, 2], BOB); // closes sq3 -> BOB, fills the grid

    expect(closing.status).toBe(GameConstants.STATUS_OVER_BY_DRAW);
    expect(dots.getScore()).toEqual({ [ALICE]: 2, [BOB]: 2 });
    expect(dots.getWinner()).toBeNull();
    expect(dots.isDraw()).toBe(true);
  });

  it("throws when a coordinate is out of bounds", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    expect(() => dots.play([0, 0], [0, 3], ALICE)).toThrow(/out of bounds/);
    expect(() => dots.play([-1, 0], [0, 0], ALICE)).toThrow(/out of bounds/);
  });

  it("throws when the two dots are not adjacent", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    expect(() => dots.play([0, 0], [1, 1], ALICE)).toThrow(/adjacent/);
    expect(() => dots.play([0, 0], [0, 2], ALICE)).toThrow(/adjacent/);
  });

  it("rejects an already-drawn edge without mutating state", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    dots.play([0, 0], [0, 1], ALICE);

    expect(() => dots.play([0, 0], [0, 1], BOB)).toThrow(/already drawn/);
    // reversed orientation is the same edge -> also rejected
    expect(() => dots.play([0, 1], [0, 0], BOB)).toThrow(/already drawn/);

    // no state change: history length unchanged, no score for BOB
    expect(dots.playHistory.length).toBe(1);
    expect(dots.getScore()).toEqual({});
  });

  it("throws when playing after the game is over", () => {
    const dots = new Dots(2, [ALICE, BOB]);
    dots.play([0, 0], [0, 1], ALICE);
    dots.play([0, 1], [1, 1], BOB);
    dots.play([1, 1], [1, 0], ALICE);
    dots.play([1, 0], [0, 0], BOB); // closes the only square -> game over
    expect(() => dots.play([0, 0], [1, 0], ALICE)).toThrow("Game is over");
  });
});

describe("Dots turn machine", () => {
  it("starts with players[0] on turn", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    expect(dots.turn).toBe(ALICE);
  });

  it("alternates turn after every move", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    dots.play([0, 0], [0, 1], ALICE);
    expect(dots.turn).toBe(BOB);
    dots.play([0, 0], [1, 0], BOB);
    expect(dots.turn).toBe(ALICE);
  });

  it("rejects a move from the player not on turn, without mutating state", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    expect(() => dots.play([0, 0], [0, 1], BOB)).toThrow(/not this player's turn/i);
    expect(dots.turn).toBe(ALICE);
    expect(dots.playHistory.length).toBe(0);
  });

  it("normalizes casing before comparing against turn", () => {
    const dots = new Dots(3, [ALICE, BOB]);
    expect(() => dots.play([0, 0], [0, 1], ALICE.toUpperCase())).not.toThrow();
  });

  it("throws when constructed with the same player twice", () => {
    expect(() => new Dots(3, [ALICE, ALICE])).toThrow(/distinct players/);
    // normalization applies before the distinctness check
    expect(() => new Dots(3, [ALICE.toLowerCase(), ALICE.toUpperCase()])).toThrow(/distinct players/);
  });
});
