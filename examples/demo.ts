import { Dots, type Coord } from "../src";

const alice = "0xAl1ce";
const bob = "0xB0b";
const dots = new Dots(3, [alice, bob]); // 3x3 dots => 2x2 squares; alice moves first

console.log("Playing moves on a 3x3 grid...\n");

// A move connects two adjacent dots. Each dot is a [x, y] tuple. Players
// strictly alternate; whoever closes a square owns it, so each move carries
// a submitter EOA address.
const moves: [Coord, Coord, string][] = [
    [[0, 0], [0, 1], alice],
    [[0, 0], [1, 0], bob],
    [[0, 1], [1, 1], alice],
    [[1, 0], [1, 1], bob], // closes square 0 -> owned by bob
];

for (const [from, to, submitter] of moves) {
    const result = dots.play(from, to, submitter);
    console.log(`play(${JSON.stringify(from)}, ${JSON.stringify(to)}, ${submitter}) ->`, result);
}

console.log("\nGame over:", dots.isOVer());
console.log("Score:", dots.getScore());
