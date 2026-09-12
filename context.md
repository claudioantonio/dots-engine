# Context

Deeper background for working on this repo. See `AGENTS.md` for commands/layout/conventions.

## What this is

A pure-logic engine for 1v1 "Dots" matches, designed to be **deterministic**
so it can run in decentralized/blockchain contexts: the same move log must
produce byte-identical output wherever it's executed — a smart contract, an
off-chain verifier, a browser replay, or any other environment a
decentralized application might run this engine in. This isn't tied to any
one chain, VM, or rollup architecture; determinism is a portability
guarantee, not a feature for a specific platform.

## Determinism is load-bearing, not a style preference

`eslint.config.mjs` bans `Date.now()`, `Math.random()`, and `for...in` — any
of these would make the engine's output diverge between two environments
given the same input, which breaks it for any architecture that needs
independently-computed results to agree (on-chain execution, multi-party
verification, replay/reconstruction from a log, etc).

- `Dots` never stamps a move with a time, detects a stalled turn, or forfeits
  a non-responding player — there's no `timestamp` parameter or field
  anywhere in the engine. Timing, turn timeouts, and replay are deliberately
  left to the client/orchestrator: pair each `play()` call with your own
  timestamp/sequencing outside the engine if you need one.
- `MoveRecord` (src/types.ts) is deliberately the *same shape* as both the
  per-move notification payload and the replay-log entry, so the two can
  never drift apart.

## Domain model

- **Point / Edge / Square** (`Grid.ts` + friends): hybrid model matching how
  the game is physically played — players think in dots and lines, the
  engine also tracks squares internally for scoring.
- **PlayerId**: normalized to lowercase at every ingress (`src/address.ts`).
  Different callers can supply the same address in different casing (e.g. a
  wallet's EIP-55 checksum-cased form vs. a lowercase on-chain sender field);
  without normalizing, the same player could fork into two score buckets.
- **Match rules**: exactly 2 distinct players; `players[0]` moves first; turn
  alternates on a non-closing move, but a move that closes 1–2 squares keeps
  the turn ("extra move on close"). This is a real rule, not a bug — see
  `Dots.play()`'s "Extra move on close" comment.
- **`longestChain`**: per-player longest run of squares closed in one
  uninterrupted turn, tracked separately from score (king-of-the-chain
  side-metric).

## Things that will trip you up

- The engine went through a free-for-all phase (any address could draw any
  edge, no turns) before landing on strict 1v1 turn-based matches (`git log`:
  "Migrate from turn based to free-for-all", later reverted by "Enforce
  strict 1v1 turn alternation"). README.md has been brought back in sync with
  the current API — if it and `src/` ever disagree again, `src/` wins.
- **`docs/TODO.md` and a "PRD-v5" doc are referenced by code comments**
  (`eslint.config.mjs`, `Dots.ts`) but don't exist in this checkout — they're
  maintained outside the repo. Section references like "§6.4" point there,
  not to anything you can `grep` locally.
- Comments citing those docs by section number are the closest thing to a
  spec for *why* a rule exists (e.g. extra-move-on-close, determinism
  ground rules) — treat them as intentional, not leftover cruft.
