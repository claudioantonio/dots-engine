# dots-engine

A TypeScript engine for the classic "Dots" game - a paper-and-pencil strategy game.

## About the Game

Dots is a classic strategy game that many people played in school. This engine
runs it as a shared, free-for-all board where each move is tagged with the
submitter's address:

- Start with a grid of dots
- Anyone connects two adjacent dots with a horizontal or vertical line
- When a move completes a square (its fourth edge), that square is owned by the submitter
- The game ends when no more lines can be drawn
- The address with the most completed squares wins

## Features

The TypeScript engine provides:

- **Complete Game Logic**: Full implementation of the dots game mechanics
- **Configurable Grid**: Support for different grid sizes (minimum 2x2)
- **Free-for-All Ownership**: Any address can draw any open edge; whoever closes a square owns it
- **Score Tracking**: Automatic per-address tally of closed squares
- **Game State Management**: Tracks game status (in progress, over, draw)
- **Move Validation**: Ensures valid moves and prevents playing after game end
- **Play History**: Records all moves made during the game
- **Point-Based Model**: Players connect dots using coordinate pairs
- **Square-Based Logic**: Internal square tracking for scoring and game state

## Key Components

- **`Dots.ts`**: Main game class that orchestrates the entire game
- **`Grid.ts`**: Manages the game board, points, squares, and edges
- **`Edge.ts`**: Represents connections between dots using coordinate pairs
- **`Point.ts`**: Represents individual dots on the grid
- **`Square.ts`**: Represents the squares that can be completed
- **`GameConstants.ts`**: Game constants and status definitions

## Game Model

The engine uses a hybrid model that matches how the game is actually played:

- **Points/Dots**: The primary entities that players interact with
- **Edges**: Connections between adjacent points specified by coordinate pairs
- **Squares**: Internal entities for tracking completed squares and scoring
- **Coordinate System**: Players specify moves as two adjacent dots, `[x1, y1]` and `[x2, y2]`

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

const dots = new Dots(3); // Create a 3x3 grid (2x2 squares)

// It's a free-for-all: anyone can draw any open edge, identified by their
// address. A dot is a coordinate tuple [x, y] (x = column, y = row, 0-based).
const alice = "0xAl1ce";
dots.play([0, 0], [0, 1], alice); // Connect dots (0,0) and (0,1)
dots.play([0, 0], [1, 0], alice); // Connect dots (0,0) and (1,0)
dots.play([0, 1], [1, 1], alice); // Connect dots (0,1) and (1,1)

// play() returns what changed, so you can re-render straight from it.
const result = dots.play([1, 0], [1, 1], alice); // Completes square 0, owned by alice
console.log(result); // { squaresClosed: 1, submitter: "0xAl1ce", status: 2 }

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore()); // { "0xAl1ce": 1 }
```

### Advanced Example

```typescript
import { Dots } from "dots-engine";

const dots = new Dots(4); // Create a 4x4 grid

// Play a series of moves (each tagged with the submitter's address)
const alice = "0xAl1ce";
dots.play([0, 0], [0, 1], alice);
dots.play([0, 0], [1, 0], alice);
dots.play([0, 1], [1, 1], alice);
dots.play([1, 0], [1, 1], alice);

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore());
console.log("Is draw:", dots.isDraw());
console.log("Winner:", dots.getWinner());

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

The engine speaks plain coordinate tuples, so the same `Coord` type can describe
your UI state and feed `play` directly — no engine-internal classes to import,
and everything is JSON-serializable.

```typescript
import { Dots, type Coord } from "dots-engine";

const dots = new Dots(3);
let selected: Coord | null = null;
const myAddress = "0xMe"; // the connected wallet's address

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
    // not adjacent / out of bounds — show feedback to the user
  } finally {
    selected = null;
  }
}
```

A move is always an *edge* (two dots), so the two-click selection lives in your
UI; the engine only ever receives one complete `play(from, to)` call.

## API Reference

### Constructor
```typescript
new Dots(gridSize: number)
```
Creates a new game with the specified grid size (minimum 2).

### Methods

#### `play(from: Coord, to: Coord, submitter: string): MoveResult`
Connects two adjacent dots, drawing the edge between them. A `Coord` is a
`[number, number]` tuple `[x, y]`, where `x` is the column and `y` the row
(both 0-based). The two dots must be orthogonally adjacent and within grid
bounds. `submitter` is the address drawing the edge; it owns any squares the
move closes.

```typescript
const result = dots.play([0, 0], [0, 1], "0xAl1ce");
```

Returns a `MoveResult`:

| Field | Type | Meaning |
|-------|------|---------|
| `squaresClosed` | `number` | Squares completed by this move (0, 1, or 2). |
| `submitter` | `string` | Address that submitted the move (owns any squares it closed). |
| `status` | `number` | Game status after the move (see `GameConstants.STATUS_*`). |

Throws if the game is already over, a coordinate is out of bounds, or the two
dots are not adjacent.

#### `getScore()`
Returns the score as a map of submitter address to number of closed squares,
e.g. `{ "0xAl1ce": 3, "0xB0b": 2 }`.

#### `isOVer()`
Returns `true` if the game has ended.

#### `isDraw()`
Returns `true` if the game ended with the top square count tied between two or
more addresses.

#### `getWinner()`
Returns the address owning the most closed squares, or `null` when the top count
is tied (a draw).

### Grid Methods

#### `getSquarePosition(squareId: number): [number, number]`
Returns the position `[row, col]` of a square given its ID.

#### `getSquareId(row: number, col: number): number`
Returns the square ID given its position.

#### `getSquaresForEdge(edge: Edge): number[]`
Returns an array of square IDs that share the specified edge.

#### `findEdge(p1: Point, p2: Point): Edge | null`
Finds an edge by its two points.

#### `getPoints(): Point[]`
Returns all points in the grid.

## Coordinate System

- **Dots**: A dot is a `Coord` tuple `[x, y]`, where `x` is the column and `y` the row (both 0-based), ranging from `[0, 0]` to `[gridSize-1, gridSize-1]`.
- **Moves**: A move connects two orthogonally adjacent dots (the edge between them).
- **Squares**: Internal tracking with IDs `0, 1, 2, …` arranged in rows.
- **Validation**: `play` ensures the two dots are adjacent and within grid bounds.

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