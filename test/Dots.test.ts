import Dots from "../src/Dots";
import { GameConstants } from "../src/GameConstants";

const ALICE = "0xal1ce";
const BOB = "0xb0b";
const MATCH_ID = "match-1";
const T0 = 1000;

describe("Dots.play", () => {
  it("accepts a move as two coordinate tuples and records it", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    const result = dots.play([0, 0], [0, 1], ALICE, T0);

    expect(result.squaresClosed).toBe(0);
    expect(result.submitter).toBe(ALICE);
    expect(result.status).toBe(GameConstants.STATUS_IN_PROGRESS);
    expect(dots.moveLog.length).toBe(1);
  });

  it("credits the closed square to its submitter and ends the game", () => {
    const dots = new Dots(2, [ALICE, BOB], MATCH_ID); // a single square
    expect(dots.play([0, 0], [0, 1], ALICE, T0).squaresClosed).toBe(0);
    expect(dots.play([0, 1], [1, 1], BOB, T0).squaresClosed).toBe(0);
    expect(dots.play([1, 1], [1, 0], ALICE, T0).squaresClosed).toBe(0);

    const closing = dots.play([1, 0], [0, 0], BOB, T0); // BOB closes the square
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
    const dots = new Dots(2, [BOB, ALICE_LOWER], MATCH_ID);

    dots.play([0, 0], [0, 1], BOB, T0);
    dots.play([0, 1], [1, 1], ALICE_UPPER, T0); // accepted: normalizes to the same turn as ALICE_LOWER
    dots.play([1, 1], [1, 0], BOB, T0);
    const closing = dots.play([1, 0], [0, 0], ALICE_LOWER, T0); // closes the square

    expect(closing.submitter).toBe(ALICE_LOWER);
    expect(dots.getScore()).toEqual({ [ALICE_LOWER]: 1 });
    expect(dots.grid.squares[0].owner).toBe(ALICE_LOWER);
  });

  it("tallies squares per address across multiple submitters", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    // Square 0 (top-left) and square 3 (bottom-right) share no edge, so ALICE
    // and BOB can each build one while strictly alternating (no closes yet).
    expect(dots.play([0, 0], [0, 1], ALICE, T0).squaresClosed).toBe(0); // sq0
    expect(dots.play([1, 1], [1, 2], BOB, T0).squaresClosed).toBe(0); // sq3
    expect(dots.play([0, 1], [1, 1], ALICE, T0).squaresClosed).toBe(0); // sq0
    expect(dots.play([1, 2], [2, 2], BOB, T0).squaresClosed).toBe(0); // sq3
    expect(dots.play([1, 1], [1, 0], ALICE, T0).squaresClosed).toBe(0); // sq0
    expect(dots.play([2, 2], [2, 1], BOB, T0).squaresClosed).toBe(0); // sq3

    // ALICE closes sq0 and keeps the turn (extra move on close); she spends
    // it on a neutral edge of square 1 rather than sq3, handing the turn
    // back to BOB, who then closes sq3 himself.
    expect(dots.play([1, 0], [0, 0], ALICE, T0).squaresClosed).toBe(1); // closes sq0
    expect(dots.turn).toBe(ALICE); // extra move: turn stayed
    expect(dots.play([2, 0], [1, 0], ALICE, T0).squaresClosed).toBe(0); // sq1, neutral
    expect(dots.turn).toBe(BOB); // non-closing move: turn flips back
    expect(dots.play([2, 1], [1, 1], BOB, T0).squaresClosed).toBe(1); // closes sq3

    expect(dots.getScore()).toEqual({ [ALICE]: 1, [BOB]: 1 });
  });

  it("ends in a draw when the top square count is tied", () => {
    // A full, turn-legal replay of the 2x2 grid (12 edges) under the
    // extra-move-on-close rule, landing on a 2-2 split: BOB closes sq1 then
    // sq0 back-to-back (two extra moves), ALICE closes sq3 then sq2
    // back-to-back (two extra moves).
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    dots.play([1, 2], [2, 2], ALICE, T0); // 0 closed -> flip to BOB
    dots.play([2, 2], [2, 1], BOB, T0); // 0 closed -> flip to ALICE
    dots.play([1, 1], [1, 0], ALICE, T0); // 0 closed -> flip to BOB
    dots.play([2, 1], [2, 0], BOB, T0); // 0 closed -> flip to ALICE
    dots.play([1, 1], [2, 1], ALICE, T0); // 0 closed -> flip to BOB
    expect(dots.play([2, 0], [1, 0], BOB, T0).squaresClosed).toBe(1); // closes sq1 -> BOB, turn stays
    dots.play([0, 0], [0, 1], BOB, T0); // 0 closed -> flip to ALICE
    dots.play([1, 0], [0, 0], ALICE, T0); // 0 closed -> flip to BOB
    expect(dots.play([0, 1], [1, 1], BOB, T0).squaresClosed).toBe(1); // closes sq0 -> BOB, turn stays
    dots.play([0, 2], [1, 2], BOB, T0); // 0 closed -> flip to ALICE
    expect(dots.play([1, 2], [1, 1], ALICE, T0).squaresClosed).toBe(1); // closes sq3 -> ALICE, turn stays
    const closing = dots.play([0, 1], [0, 2], ALICE, T0); // closes sq2 -> ALICE, fills the grid

    expect(closing.squaresClosed).toBe(1);
    expect(closing.status).toBe(GameConstants.STATUS_OVER_BY_DRAW);
    expect(dots.getScore()).toEqual({ [ALICE]: 2, [BOB]: 2 });
    expect(dots.getWinner()).toBeNull();
    expect(dots.isDraw()).toBe(true);
  });

  it("throws when a coordinate is out of bounds", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    expect(() => dots.play([0, 0], [0, 3], ALICE, T0)).toThrow(/out of bounds/);
    expect(() => dots.play([-1, 0], [0, 0], ALICE, T0)).toThrow(/out of bounds/);
  });

  it("throws when the two dots are not adjacent", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    expect(() => dots.play([0, 0], [1, 1], ALICE, T0)).toThrow(/adjacent/);
    expect(() => dots.play([0, 0], [0, 2], ALICE, T0)).toThrow(/adjacent/);
  });

  it("rejects an already-drawn edge without mutating state", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    dots.play([0, 0], [0, 1], ALICE, T0);

    expect(() => dots.play([0, 0], [0, 1], BOB, T0)).toThrow(/already drawn/);
    // reversed orientation is the same edge -> also rejected
    expect(() => dots.play([0, 1], [0, 0], BOB, T0)).toThrow(/already drawn/);

    // no state change: log length unchanged, no score for BOB
    expect(dots.moveLog.length).toBe(1);
    expect(dots.getScore()).toEqual({});
  });

  it("throws when playing after the game is over", () => {
    const dots = new Dots(2, [ALICE, BOB], MATCH_ID);
    dots.play([0, 0], [0, 1], ALICE, T0);
    dots.play([0, 1], [1, 1], BOB, T0);
    dots.play([1, 1], [1, 0], ALICE, T0);
    dots.play([1, 0], [0, 0], BOB, T0); // closes the only square -> game over
    expect(() => dots.play([0, 0], [1, 0], ALICE, T0)).toThrow("Game is over");
  });
});

describe("Dots.moveLog", () => {
  it("records a full MoveRecord per applied move, with sequencing", () => {
    const dots = new Dots(2, [ALICE, BOB], MATCH_ID); // a single square
    dots.play([0, 0], [0, 1], ALICE, 1000);
    dots.play([0, 1], [1, 1], BOB, 1001);
    dots.play([1, 1], [1, 0], ALICE, 1002);
    const closing = dots.play([1, 0], [0, 0], BOB, 1003); // closes the square, game ends

    expect(dots.moveLog).toEqual([
      {
        matchId: MATCH_ID,
        moveIndex: 0,
        edge: [[0, 0], [0, 1]],
        submitter: ALICE,
        squaresClosed: 0,
        turnAfter: BOB,
        timestamp: 1000,
      },
      {
        matchId: MATCH_ID,
        moveIndex: 1,
        edge: [[0, 1], [1, 1]],
        submitter: BOB,
        squaresClosed: 0,
        turnAfter: ALICE,
        timestamp: 1001,
      },
      {
        matchId: MATCH_ID,
        moveIndex: 2,
        edge: [[1, 1], [1, 0]],
        submitter: ALICE,
        squaresClosed: 0,
        turnAfter: BOB,
        timestamp: 1002,
      },
      {
        matchId: MATCH_ID,
        moveIndex: 3,
        edge: [[1, 0], [0, 0]],
        submitter: BOB,
        squaresClosed: 1,
        turnAfter: BOB, // closing move keeps the turn (extra move on close)
        timestamp: 1003,
      },
    ]);
    expect(closing.squaresClosed).toBe(1);
  });
});

describe("Dots turn machine", () => {
  it("starts with players[0] on turn", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    expect(dots.turn).toBe(ALICE);
  });

  it("alternates turn after every move", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    dots.play([0, 0], [0, 1], ALICE, T0);
    expect(dots.turn).toBe(BOB);
    dots.play([0, 0], [1, 0], BOB, T0);
    expect(dots.turn).toBe(ALICE);
  });

  it("rejects a move from the player not on turn, without mutating state", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    expect(() => dots.play([0, 0], [0, 1], BOB, T0)).toThrow(/not this player's turn/i);
    expect(dots.turn).toBe(ALICE);
    expect(dots.moveLog.length).toBe(0);
  });

  it("normalizes casing before comparing against turn", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID);
    expect(() => dots.play([0, 0], [0, 1], ALICE.toUpperCase(), T0)).not.toThrow();
  });

  it("throws when constructed with the same player twice", () => {
    expect(() => new Dots(3, [ALICE, ALICE], MATCH_ID)).toThrow(/distinct players/);
    // normalization applies before the distinctness check
    expect(() => new Dots(3, [ALICE.toLowerCase(), ALICE.toUpperCase()], MATCH_ID)).toThrow(/distinct players/);
  });
});

describe("Dots extra move on close", () => {
  it("closing exactly one square keeps the turn with the same player", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    dots.play([0, 0], [0, 1], ALICE, T0); // 0 closed -> flip to BOB
    dots.play([1, 0], [0, 0], BOB, T0); // 0 closed -> flip to ALICE
    dots.play([1, 0], [1, 1], ALICE, T0); // 0 closed -> flip to BOB
    const closing = dots.play([0, 1], [1, 1], BOB, T0); // closes sq0

    expect(closing.squaresClosed).toBe(1);
    expect(dots.turn).toBe(BOB); // extra move: turn did not flip

    // BOB can immediately play again on the strength of the extra move.
    expect(() => dots.play([1, 1], [2, 1], BOB, T0)).not.toThrow();
  });

  it("closing two squares in one move (double-cross) keeps the turn", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    // Build every edge of sq0 and sq1 except their shared edge [1,0]-[1,1].
    dots.play([0, 0], [0, 1], ALICE, T0); // sq0 border, 0 closed -> flip BOB
    dots.play([1, 1], [2, 1], BOB, T0); // sq1 border, 0 closed -> flip ALICE
    dots.play([0, 1], [1, 1], ALICE, T0); // sq0 border, 0 closed -> flip BOB
    dots.play([2, 1], [2, 0], BOB, T0); // sq1 border, 0 closed -> flip ALICE
    dots.play([1, 0], [0, 0], ALICE, T0); // sq0 border, 0 closed -> flip BOB
    dots.play([2, 0], [1, 0], BOB, T0); // sq1 border, 0 closed -> flip ALICE

    // The shared edge completes both squares at once.
    const closing = dots.play([1, 0], [1, 1], ALICE, T0);

    expect(closing.squaresClosed).toBe(2);
    expect(dots.turn).toBe(ALICE); // extra move: turn did not flip
    expect(dots.getScore()).toEqual({ [ALICE]: 2 });
  });

  it("chains multiple extra moves for the same player across independent squares", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    // Build sq0 (top-left) and sq3 (bottom-right) to 3/4 edges each, leaving
    // one closing edge per square, via strict (non-closing) alternation.
    dots.play([0, 0], [0, 1], ALICE, T0); // sq0, 0 closed -> flip BOB
    dots.play([1, 1], [2, 1], BOB, T0); // sq3, 0 closed -> flip ALICE
    dots.play([1, 0], [1, 1], ALICE, T0); // sq0, 0 closed -> flip BOB
    dots.play([1, 2], [2, 2], BOB, T0); // sq3, 0 closed -> flip ALICE
    dots.play([1, 0], [0, 0], ALICE, T0); // sq0, 0 closed -> flip BOB
    dots.play([2, 2], [2, 1], BOB, T0); // sq3, 0 closed -> flip ALICE

    dots.play([0, 1], [1, 1], ALICE, T0); // closes sq0 -> turn stays ALICE
    dots.play([1, 2], [1, 1], ALICE, T0); // closes sq3 -> turn stays ALICE (2nd extra move)

    expect(dots.turn).toBe(ALICE);
    const lastTwo = dots.moveLog.slice(-2);
    expect(lastTwo.map((m) => m.submitter)).toEqual([ALICE, ALICE]);
    expect(lastTwo.map((m) => m.squaresClosed)).toEqual([1, 1]);
    expect(lastTwo.map((m) => m.turnAfter)).toEqual([ALICE, ALICE]);
  });

  it("still rejects the opponent moving immediately after a square-closing move", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    dots.play([0, 0], [0, 1], ALICE, T0); // 0 closed -> flip to BOB
    dots.play([1, 0], [0, 0], BOB, T0); // 0 closed -> flip to ALICE
    dots.play([1, 0], [1, 1], ALICE, T0); // 0 closed -> flip to BOB
    dots.play([0, 1], [1, 1], BOB, T0); // closes sq0 -> turn stays BOB

    expect(() => dots.play([1, 1], [2, 1], ALICE, T0)).toThrow(/not this player's turn/i);
    expect(dots.turn).toBe(BOB);
    expect(dots.moveLog.length).toBe(4); // rejected attempt did not mutate state
  });
});

describe("Dots longest chain (king of the chain)", () => {
  it("records a single-square close as a chain of 1", () => {
    const dots = new Dots(2, [ALICE, BOB], MATCH_ID); // a single square
    dots.play([0, 0], [0, 1], ALICE, T0);
    dots.play([0, 1], [1, 1], BOB, T0);
    dots.play([1, 1], [1, 0], ALICE, T0);
    dots.play([1, 0], [0, 0], BOB, T0); // BOB closes the only square

    expect(dots.getLongestChain()).toEqual({ [BOB]: 1 });
  });

  it("accumulates a double-cross close as a chain of 2, not two separate 1s", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    dots.play([0, 0], [0, 1], ALICE, T0);
    dots.play([1, 1], [2, 1], BOB, T0);
    dots.play([0, 1], [1, 1], ALICE, T0);
    dots.play([2, 1], [2, 0], BOB, T0);
    dots.play([1, 0], [0, 0], ALICE, T0);
    dots.play([2, 0], [1, 0], BOB, T0);
    dots.play([1, 0], [1, 1], ALICE, T0); // closes sq0 and sq1 at once

    expect(dots.getLongestChain()).toEqual({ [ALICE]: 2 });
  });

  it("sums consecutive extra-move closes into one chain, reused from the extra-move-chain scenario", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    dots.play([0, 0], [0, 1], ALICE, T0);
    dots.play([1, 1], [2, 1], BOB, T0);
    dots.play([1, 0], [1, 1], ALICE, T0);
    dots.play([1, 2], [2, 2], BOB, T0);
    dots.play([1, 0], [0, 0], ALICE, T0);
    dots.play([2, 2], [2, 1], BOB, T0);

    dots.play([0, 1], [1, 1], ALICE, T0); // closes sq0 (chain: 1) -> turn stays ALICE
    dots.play([1, 2], [1, 1], ALICE, T0); // closes sq3 (chain: 2) -> turn stays ALICE

    expect(dots.getLongestChain()).toEqual({ [ALICE]: 2 });
  });

  it("keeps a player's max across separate, turn-interrupted chains rather than summing them", () => {
    const dots = new Dots(3, [ALICE, BOB], MATCH_ID); // 2x2 = 4 squares

    // ALICE closes sq1 alone (chain: 1), then hands the turn to BOB with a
    // neutral move so the next ALICE close starts a fresh chain.
    dots.play([1, 0], [2, 0], ALICE, T0); // sq1 border, 0 closed -> flip BOB
    dots.play([2, 0], [2, 1], BOB, T0); // sq1 border, 0 closed -> flip ALICE
    dots.play([1, 1], [2, 1], ALICE, T0); // sq1 border, 0 closed -> flip BOB
    dots.play([0, 1], [0, 2], BOB, T0); // sq2 border, 0 closed -> flip ALICE
    expect(dots.play([1, 0], [1, 1], ALICE, T0).squaresClosed).toBe(1); // closes sq1, chain: 1 -> turn stays ALICE
    expect(dots.getLongestChain()).toEqual({ [ALICE]: 1 });

    // ALICE's own next move is non-closing, so the turn flips to BOB and the
    // chain resets before ALICE gets to close sq0 in a second, separate turn.
    // (sq0's 4th edge is already drawn: it's the one ALICE used above to close
    // sq1, since sq0 and sq1 share an edge — so only two more edges are needed.)
    dots.play([0, 0], [0, 1], ALICE, T0); // sq0 left, 0 closed -> flip BOB (chain reset)
    dots.play([0, 2], [1, 2], BOB, T0); // sq2 bottom, 0 closed -> flip ALICE
    dots.play([1, 0], [0, 0], ALICE, T0); // sq0 top, 0 closed -> flip BOB
    dots.play([1, 2], [2, 2], BOB, T0); // sq3 bottom, 0 closed -> flip ALICE
    expect(dots.play([0, 1], [1, 1], ALICE, T0).squaresClosed).toBe(1); // closes sq0, chain: 1 -> turn stays ALICE

    // Max stays 1: the two chains never merge into 2, even though both are ALICE's.
    expect(dots.getLongestChain()).toEqual({ [ALICE]: 1 });
  });

  it("captures the final move's chain even though it never flips the turn", () => {
    const dots = new Dots(2, [ALICE, BOB], MATCH_ID); // a single square

    dots.play([0, 0], [0, 1], ALICE, T0);
    dots.play([0, 1], [1, 1], BOB, T0);
    dots.play([1, 1], [1, 0], ALICE, T0);
    const closing = dots.play([1, 0], [0, 0], BOB, T0); // closes the last square, match ends, turn never flips

    expect(closing.status).toBe(GameConstants.STATUS_OVER);
    expect(dots.turn).toBe(BOB); // turn stayed on BOB — the match just has no more moves
    expect(dots.getLongestChain()).toEqual({ [BOB]: 1 });
  });
});
