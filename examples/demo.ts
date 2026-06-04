import { Dots, type Coord } from "../src";

const dots = new Dots(3); // 3x3 dots => 2x2 squares

console.log("Playing moves on a 3x3 grid...\n");

// A move connects two adjacent dots. Each dot is a [x, y] tuple.
const moves: [Coord, Coord][] = [
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],
    [[0, 1], [1, 1]],
    [[1, 0], [1, 1]], // closes square 0
];

for (const [from, to] of moves) {
    const result = dots.play(from, to);
    console.log(`play(${JSON.stringify(from)}, ${JSON.stringify(to)}) ->`, result);
}

console.log("\nGame over:", dots.isOVer());
console.log("Score:", dots.getScore());
