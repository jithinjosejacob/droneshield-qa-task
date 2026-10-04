// Read access to the test documents stored in MongoDB.

import { getCollectionName, getDb } from './mongoClient';
import { TestDoc, TestType } from '../types/testSchema';

/**
 * Fetch every enabled test of a given type.
 * The `_id` is stringified so the result serialises cleanly to JSON.
 */
export async function fetchTests(type: TestType): Promise<TestDoc[]> {
  const db = await getDb();
  const docs = await db
    .collection(getCollectionName())
    .find({ type, enabled: true })
    .toArray();

  return docs.map((doc) => {
    const { _id, ...rest } = doc as Record<string, unknown> & { _id: unknown };
    return { _id: _id ? String(_id) : undefined, ...rest } as TestDoc;
  });
}
