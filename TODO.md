# TODO

## Open

- [ ] **Grant another turn when a player closes a square.** The engine currently
  alternates turns strictly (`getTurn()` = `playHistory.length % 2`), so completing
  a square does *not* give the player an extra turn. Standard Dots-and-Boxes rules
  award another turn on each completed square. Decide whether to adopt that rule;
  it changes turn logic in [src/Dots.ts](src/Dots.ts) (and `MoveResult.nextTurn`).

- [ ] **Signal when a move targets an already-drawn edge.** Replaying an edge that
  already has an owner returns `{ squaresClosed: 0, ... }`, indistinguishable from a
  legitimate zero-square move. Make it explicit — either throw from `play` (like the
  out-of-bounds / not-adjacent cases) or add a flag to `MoveResult` — so a frontend
  can tell the user "that line is already taken." See [src/Dots.ts](src/Dots.ts) and
  `conquerEdge` in [src/Grid.ts](src/Grid.ts).
