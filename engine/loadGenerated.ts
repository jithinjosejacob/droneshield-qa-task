// Synchronous read of the fetched test cache for the runner specs.
// Runs at Playwright collection time, so it must not touch the network.

import fs from 'fs';
import { generatedFileFor } from './paths';
import { TestDoc, TestType } from '../types/testSchema';

export interface LoadResult {
  docs: TestDoc[];
  /** Populated when the cache is missing/empty/corrupt — surfaced as a failing test. */
  error?: string;
}

export function loadGenerated(type: TestType): LoadResult {
  const file = generatedFileFor(type);
  if (!fs.existsSync(file)) {
    return {
      docs: [],
      error:
        `No fetched tests found at ${file}. ` +
        `Run "npm run fetch:${type}" (the npm test scripts do this automatically) ` +
        `and make sure MONGO_URI points at a seeded database.`,
    };
  }

  try {
    const docs = JSON.parse(fs.readFileSync(file, 'utf-8')) as TestDoc[];
    if (!Array.isArray(docs) || docs.length === 0) {
      return {
        docs: [],
        error: `No enabled ${type} tests in the database. Add a document (see docs/EXERCISE-3.md) or run "npm run seed".`,
      };
    }
    return { docs };
  } catch (err) {
    return {
      docs: [],
      error: `Failed to parse ${file}: ${err instanceof Error ? err.message : err}`,
    };
  }
}
