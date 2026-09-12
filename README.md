# dots-engine

A TypeScript engine for the classic "Dots" game (a.k.a. Dots and Boxes) — a
paper-and-pencil strategy game, played here as a strict 1v1 turn-based match.

The engine is designed to be **deterministic**: given the same sequence of
moves, it always produces the same result, which makes it suitable for
decentralized applications as well as any ordinary client/server setup.

## About the Game

- Start with a grid of dots.
- Players take turns connecting two adjacent dots with a horizontal or
vertical line.
- When a move completes a square (its fourth edge), that square is owned by
whoever drew the line, and that player gets an extra move.
- The game ends when no more lines can be drawn.
- The player who owns the most completed squares wins; a tie is a draw.



## Features

- **Complete Game Logic**: Full implementation of the dots-and-boxes rules.
- **Configurable Grid**: Support for different grid sizes (minimum 2x2).
- **Strict 1v1 Matches**: Exactly two players per match, alternating turns,
with an extra move for the player who closes a square.
- **Score Tracking**: Automatic per-player tally of closed squares.
- **King-of-the-Chain Tracking**: Each player's longest run of squares closed
in one uninterrupted turn.
- **Game State Management**: Tracks game status (in progress, over, draw).
- **Move Validation**: Enforces turn order, grid bounds, dot adjacency, and
rejects already-drawn edges.
- **Move Log**: Records every applied move as a JSON-serializable log, ready
for a client to replay or persist.
- **Player Identity Normalization**: Case-insensitive player IDs, so the same
player never forks into separate score buckets.
- **Point-Based Model**: Players connect dots using coordinate pairs.
- **Square-Based Logic**: Internal square tracking for scoring and game state.



## Key Components

- `Dots.ts`: Main game class that orchestrates a match — turns, scoring,
status, and the move log.
- `Grid.ts`: Manages the game board, points, squares, and edges.
- `Edge.ts`: Represents connections between dots using coordinate pairs.
- `Point.ts`: Represents individual dots on the grid.
- `Square.ts`: Represents the squares that can be completed.
- `GameConstants.ts`: Game constants and status definitions.
- `address.ts`: Normalizes player identifiers so identity is consistent
regardless of input casing.



## Game Model

The engine uses a hybrid model that matches how the game is actually played:

- **Points/Dots**: The primary entities that players interact with.
- **Edges**: Connections between adjacent points specified by coordinate pairs.
- **Squares**: Internal entities for tracking completed squares and scoring.
- **Coordinate System**: Players specify moves as two adjacent dots, `[x1, y1]` and `[x2, y2]`.



### Example: 3x3 Grid

```
Points: (0,0) (1,0) (2,0)
        (0,1) (1,1) (2,1)
        (0,2) (1,2) (2,2)

Squares: 4 squares arranged as 2x2
Square 0 at (0,0)  Square 1 at (0,1)
Square 2 at (1,0)  Square 3 at (1,1)
```



## Installation

```bash
npm install dots-engine
```



## Usage



### Basic Example

```typescript
import { Dots } from "dots-engine";

const alice = "0xAl1ce";
const bob = "0xB0b";

// Create a 3x3 grid (2x2 squares) for a match between alice and bob.
// alice is players[0], so she moves first.
const dots = new Dots(3, [alice, bob], "match-1");

// Each move connects two adjacent dots, submitted by the player on turn.
dots.play([0, 0], [0, 1], alice);
dots.play([0, 0], [1, 0], bob);
dots.play([0, 1], [1, 1], alice);

// play() returns what changed, so you can re-render straight from it.
const result = dots.play([1, 0], [1, 1], bob); // Completes square 0, owned by bob
console.log(result); // { squaresClosed: 1, submitter: "0xb0b", status: 2 }

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore()); // { "0xb0b": 1 }
```



### Advanced Example

```typescript
import { Dots } from "dots-engine";

const alice = "0xAl1ce";
const bob = "0xB0b";
const dots = new Dots(4, [alice, bob], "match-2"); // Create a 4x4 grid

dots.play([0, 0], [0, 1], alice);
dots.play([0, 0], [1, 0], bob);
dots.play([0, 1], [1, 1], alice);
dots.play([1, 0], [1, 1], bob);

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore());
console.log("Is draw:", dots.isDraw());
console.log("Winner:", dots.getWinner());
console.log("Longest chains:", dots.getLongestChain());
console.log("Move log:", dots.moveLog);

// Get square position from ID
const grid = dots.grid;
const [row, col] = grid.getSquarePosition(5); // Square 5
console.log("Square 5 is at position:", row, col);

// Get square ID from position
const squareId = grid.getSquareId(1, 2); // Position (1,2)
console.log("Position (1,2) corresponds to square:", squareId);

// Show all points in the grid
console.log("All points in the grid:");
for (let point of grid.getPoints()) {
    console.log(`Point: ${point.toString()}`);
}
```



### Frontend usage

The engine speaks plain coordinate tuples, so the same `Coord` type can
describe your UI state and feed `play` directly — no engine-internal classes
to import, and everything is JSON-serializable.

```typescript
import { Dots, type Coord } from "dots-engine";

const dots = new Dots(3, ["0xAl1ce", "0xB0b"], "match-3");
let selected: Coord | null = null;
const myAddress = "0xAl1ce"; // the connected wallet's address

// Call this whenever the user clicks a dot.
function onDotClick(dot: Coord) {
  if (!selected) {
    selected = dot;          // first click: remember the start dot
    return;
  }
  try {
    const result = dots.play(selected, dot, myAddress); // second click: complete the move
    // re-render from result.submitter / result.status / dots.getScore()
  } catch (err) {
    // not this player's turn / not adjacent / out of bounds — show feedback to the user
  } finally {
    selected = null;
  }
}
```

A move is always an *edge* (two dots), so the two-click selection lives in
your UI; the engine only ever receives one complete `play(from, to, submitter)` call.

## Determinism

The engine never reads the wall clock or uses randomness — `Date.now()` and
`Math.random()` are both banned by lint rules — so two independent
executions of the same sequence of `play()` calls always produce the same
state, score, and outcome, whether that's in a browser, on a server, or
inside a blockchain's execution environment.

The engine itself doesn't timestamp moves, detect a stalled turn, or forfeit
a non-responding player. Timing, turn timeouts, and replaying a match's
history from a log are all client/orchestration concerns built on top of
`Dots` (e.g. by pairing each `play()` call with your own timestamp), not
things this engine implements.

## Coordinate System

- **Dots**: A dot is a `Coord` tuple `[x, y]`, where `x` is the column and `y` the row (both 0-based), ranging from `[0, 0]` to `[gridSize-1, gridSize-1]`.
- **Moves**: A move connects two orthogonally adjacent dots (the edge between them).
- **Squares**: Internal tracking with IDs `0, 1, 2, …` arranged in rows.
- **Validation**: `play` enforces turn order, and that the two dots are adjacent and within grid bounds.



## Development



### Running Tests

```bash
npm test
```



### Running Demo

```bash
npm run dev
```



## License

ISC License