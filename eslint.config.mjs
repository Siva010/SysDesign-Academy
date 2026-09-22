import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

/* Next's own rule sets, including the React hooks rules the code already carries directives
   for. `next lint` is deprecated, so this runs as plain `eslint .`. */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['node_modules/**', '.next/**', 'out/**', '.wrangler/**', 'next-env.d.ts'] },
];

export default config;
