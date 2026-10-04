// Fetch step — runs to completion BEFORE `playwright test`.
//
// Playwright collects test() calls by importing spec files synchronously, but
// the Mongo driver is async. So we fetch here, write a local JSON cache, and
// let the runner spec read that cache synchronously at collection time.
//
// Usage: tsx scripts/fetchTests.ts <ui|api>
// Exits non-zero on any failure so a chained `&&` halts the whole run.

import fs from 'fs';
import { fetchTests } from '../db/testRepository';
import { closeClient } from '../db/mongoClient';
import { GENERATED_DIR, generatedFileFor } from '../engine/paths';
import { TestType } from '../types/testSchema';

function parseType(arg: string | undefined): TestType {
  if (arg === 'ui' || arg === 'api') return arg;
  throw new Error(`Expected a test type of "ui" or "api", got "${arg ?? ''}".`);
}

function validate(docs: unknown[], type: TestType): void {
  docs.forEach((doc, i) => {
    const d = doc as Record<string, unknown>;
    if (!d.name || typeof d.name !== 'string') {
      throw new Error(`Document ${i} (type=${type}) is missing a string "name".`);
    }
    if (type === 'ui' && !Array.isArray(d.steps)) {
      throw new Error(`UI document "${d.name}" is missing a "steps" array.`);
    }
    if (type === 'api' && (!d.request || !Array.isArray(d.assertions))) {
      throw new Error(`API document "${d.name}" needs a "request" and "assertions".`);
    }
  });
}

async function main(): Promise<void> {
  const type = parseType(process.argv[2]);
  const docs = await fetchTests(type);
  validate(docs, type);

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(generatedFileFor(type), JSON.stringify(docs, null, 2));

  console.log(`Fetched ${docs.length} enabled ${type} test(s) -> ${generatedFileFor(type)}`);
}

main()
  .catch((err) => {
    console.error(`\nfetchTests failed: ${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeClient();
  });
