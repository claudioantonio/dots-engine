# dots-engine

A TypeScript engine for the classic "Dots" game - a paper-and-pencil strategy game.

## About the Game

Dots is a classic 2-player (or more) strategy game that many people played in school. The game mechanics are simple but engaging:

- Players start with a grid of dots on paper
- Players take turns connecting adjacent dots with horizontal or vertical lines
- When a player completes a square by connecting the fourth edge, they score a point
- The game ends when no more lines can be drawn
- The player with the most completed squares wins

## Features

The TypeScript engine provides:

- **Complete Game Logic**: Full implementation of the dots game mechanics
- **Configurable Grid**: Support for different grid sizes (minimum 2x2)
- **Score Tracking**: Automatic score management for each player
- **Turn Management**: Alternates between players automatically
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

// Players take turns connecting two adjacent dots.
// A dot is a coordinate tuple [x, y] (x = column, y = row, 0-based).
dots.play([0, 0], [0, 1]); // Connect dots (0,0) and (0,1)
dots.play([0, 0], [1, 0]); // Connect dots (0,0) and (1,0)
dots.play([0, 1], [1, 1]); // Connect dots (0,1) and (1,1)

// play() returns what changed, so you can re-render straight from it.
const result = dots.play([1, 0], [1, 1]); // Completes square 0
console.log(result); // { squaresClosed: 1, scoredBy: 1, nextTurn: 0, status: 2 }

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore());
```

### Advanced Example

```typescript
import { Dots } from "dots-engine";

const dots = new Dots(4); // Create a 4x4 grid

// Play a series of moves
dots.play([0, 0], [0, 1]);
dots.play([0, 0], [1, 0]);
dots.play([0, 1], [1, 1]);
dots.play([1, 0], [1, 1]);

console.log("Game over:", dots.isOVer());
console.log("Score:", dots.getScore());
console.log("Is draw:", dots.isDraw());

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

// Call this whenever the user clicks a dot.
function onDotClick(dot: Coord) {
  if (!selected) {
    selected = dot;          // first click: remember the start dot
    return;
  }
  try {
    const result = dots.play(selected, dot); // second click: complete the move
    // re-render from result.nextTurn / result.status / dots.getScore()
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

#### `play(from: Coord, to: Coord): MoveResult`
Connects two adjacent dots, drawing the edge between them. A `Coord` is a
`[number, number]` tuple `[x, y]`, where `x` is the column and `y` the row
(both 0-based). The two dots must be orthogonally adjacent and within grid
bounds.

```typescript
const result = dots.play([0, 0], [0, 1]);
```

Returns a `MoveResult`:

| Field | Type | Meaning |
|-------|------|---------|
| `squaresClosed` | `number` | Squares completed by this move (0, 1, or 2). |
| `scoredBy` | `number` | Player who made the move (`0` = player 1, `1` = player 2). |
| `nextTurn` | `number` | Player whose turn it is now. |
| `status` | `number` | Game status after the move (see `GameConstants.STATUS_*`). |

Throws if the game is already over, a coordinate is out of bounds, or the two
dots are not adjacent.

#### `getScore()`
Returns the current score for both players.

#### `isOVer()`
Returns `true` if the game has ended.

#### `isDraw()`
Returns `true` if the game ended in a draw.

#### `getTurn()`
Returns the current player's turn (0 for player 1, 1 for player 2).

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