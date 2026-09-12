# AGENTS.md

TypeScript engine for the "Dots" paper-and-pencil game. Pure logic library, no UI.

## Commands

- `npm run build` — compile to `dist/` (tsconfig.build.json)
- `npm test` — run Jest test suite
- `npm run lint` — ESLint
- `npm run dev` — run `examples/demo.ts` via ts-node

Run `npm test` and `npm run lint` before considering a change done.

## Layout

- `src/` — engine source (`Dots.ts` orchestrates; `Grid.ts`, `Edge.ts`, `Point.ts`, `Square.ts` are the model)
- `test/` — one Jest spec per `src/` file, same name
- `dist/` — build output, do not edit by hand
- `docs/` — PRD and TODO notes

## Conventions

- Keep 100% coverage on board primitives (`Grid`, `Edge`, `Point`, `Square`) — add tests alongside any behavior change.
- No UI/framework dependencies belong in `src/`; this package is consumed as a library.
