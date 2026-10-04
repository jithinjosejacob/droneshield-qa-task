// Single source of truth for where fetched test documents are cached on disk.
// The fetch script writes here; the runner specs read from here synchronously.

import path from 'path';
import { TestType } from '../types/testSchema';

export const GENERATED_DIR = path.resolve(__dirname, '..', '.generated');

export function generatedFileFor(type: TestType): string {
  return path.join(GENERATED_DIR, `${type}.tests.json`);
}
