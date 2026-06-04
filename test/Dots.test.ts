import Dots from "../src/Dots";
import { GameConstants } from "../src/GameConstants";

describe("Dots.play", () => {
  it("accepts a move as two coordinate tuples and records it", () => {
    const dots = new Dots(3);
    const result = dots.play([0, 0], [0, 1]);

    expect(result.squaresClosed).toBe(0);
    expect(result.scoredBy).toBe(GameConstants.PLAYER1);
    expect(result.nextTurn).toBe(GameConstants.PLAYER2);
    expect(result.status).toBe(GameConstants.STATUS_IN_PROGRESS);
    expect(dots.playHistory.length).toBe(1);
  });

  it("alternates turns between players", () => {
    const dots = new Dots(3);
    expect(dots.getTurn()).toBe(GameConstants.PLAYER1);
    dots.play([0, 0], [0, 1]);
    expect(dots.getTurn()).toBe(GameConstants.PLAYER2);
    dots.play([0, 0], [1, 0]);
    expect(dots.getTurn()).toBe(GameConstants.PLAYER1);
  });

  it("reports a closed square, credits the scoring player, and ends the game", () => {
    const dots = new Dots(2); // a single square
    expect(dots.play([0, 0], [0, 1]).squaresClosed).toBe(0); // P1
    expect(dots.play([0, 1], [1, 1]).squaresClosed).toBe(0); // P2
    expect(dots.play([1, 1], [1, 0]).squaresClosed).toBe(0); // P1

    const closing = dots.play([1, 0], [0, 0]); // P2 closes the square
    expect(closing.squaresClosed).toBe(1);
    expect(closing.scoredBy).toBe(GameConstants.PLAYER2);
    expect(closing.status).toBe(GameConstants.STATUS_OVER);
    expect(dots.isOVer()).toBe(true);
    expect(dots.getScore()).toEqual({ player1: 0, player2: 1 });
  });

  it("throws when a coordinate is out of bounds", () => {
    const dots = new Dots(3);
    expect(() => dots.play([0, 0], [0, 3])).toThrow(/out of bounds/);
    expect(() => dots.play([-1, 0], [0, 0])).toThrow(/out of bounds/);
  });

  it("throws when the two dots are not adjacent", () => {
    const dots = new Dots(3);
    expect(() => dots.play([0, 0], [1, 1])).toThrow(/adjacent/);
    expect(() => dots.play([0, 0], [0, 2])).toThrow(/adjacent/);
  });

  it("throws when playing after the game is over", () => {
    const dots = new Dots(2);
    dots.play([0, 0], [0, 1]);
    dots.play([0, 1], [1, 1]);
    dots.play([1, 1], [1, 0]);
    dots.play([1, 0], [0, 0]); // closes the only square -> game over
    expect(() => dots.play([0, 0], [1, 0])).toThrow("Game is over");
  });
});
