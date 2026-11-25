// Read access to the test documents stored in MongoDB.

import { ObjectId } from 'mongodb';
import { getCollectionName, getDb } from './mongoClient';
import { TestDoc, TestType } from '../types/testSchema';

export interface FetchOptions {
  /**
   * When provided, fetch exactly these documents by _id (regardless of the
   * `enabled` flag) instead of every enabled test. Used by the web app to run
   * a selected subset. Invalid id strings are ignored.
   */
  ids?: string[];
}

/**
 * Fetch tests of a given type from the active collection (TESTS_COLLECTION).
 * Default: every enabled test. With `ids`, exactly those documents.
 * The `_id` is stringified so the result serialises cleanly to JSON.
 */
export async function fetchTests(type: TestType, options: FetchOptions = {}): Promise<TestDoc[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = { type };
  if (options.ids && options.ids.length > 0) {
    const objectIds = options.ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    filter._id = { $in: objectIds };
  } else {
    filter.enabled = true;
  }

  const docs = await db.collection(getCollectionName()).find(filter).toArray();

  return docs.map((doc) => {
    const { _id, ...rest } = doc as Record<string, unknown> & { _id: unknown };
    return { _id: _id ? String(_id) : undefined, ...rest } as TestDoc;
  });
}
