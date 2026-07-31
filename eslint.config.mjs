// @ts-check
import tseslint from 'typescript-eslint';

// Determinism ground rules (docs/TODO.md §1): the engine's output must be
// byte-identical for a given input log, in the Cartesi Machine and in the
// browser replay alike. These rules block the sources of non-determinism
// that a lint pass can actually catch; the rest (integer-only math,
// same-block tie resolution by input order) are enforced by targeted tests
// once the code they apply to exists.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    extends: [tseslint.configs.base],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message:
            'Date.now() is non-deterministic. Take timing from the input-metadata `timestamp` parameter instead.',
        },
        {
          object: 'Math',
          property: 'random',
          message:
            'Math.random() is non-deterministic and must never be used in the engine.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for...in does not guarantee insertion order for numeric-like keys. Iterate an array or Map with an explicit, stable order instead — this matters anywhere the result feeds a hash or a winner.',
        },
      ],
    },
  },
);
