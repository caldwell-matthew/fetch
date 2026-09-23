/**
 * What Datadog used to supply: global variables, and a fresh value per run.
 *
 * The values live in the repo-root `.env` (git-ignored) or in CI variables — see
 * legacy/dd_tests_backup/<date>/global_variables.json for the names and what each one was for.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/** `globals.MOBDEV` — reads process.env, and says which name is missing rather than sending "undefined". */
export const globals: Record<string, string> = new Proxy(
  {},
  {
    get(_t, name: string) {
      const value = process.env[name];
      if (value === undefined || value === '') {
        throw new Error(
          `global variable ${name} is not set — add it to the repo-root .env (it came from Datadog's global variables)`,
        );
      }
      return value;
    },
  },
) as Record<string, string>;

const POOLS = {
  numeric: '0123456789',
  alphabetic: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
};

/** Datadog's `{{ numeric(8) }}` local variables: a new value each run, so records don't collide. */
export function runId(kind: keyof typeof POOLS, length: number): string {
  const pool = POOLS[kind] ?? POOLS.numeric;
  let out = '';
  for (let i = 0; i < length; i++) out += pool[Math.floor(Math.random() * pool.length)];
  return out;
}
