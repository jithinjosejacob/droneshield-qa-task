// Thin wrapper around the MongoDB driver.
// Connection details come from the environment (.env) — never hard-coded,
// and never from the test documents themselves.

import { Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | null = null;

function getUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy .env.example to .env and point MONGO_URI at a reachable MongoDB instance.'
    );
  }
  return uri;
}

/** Lazily connect and memoise a single client for the process lifetime. */
export async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(getUri());
    await client.connect();
  }
  return client;
}

export async function getDb(): Promise<Db> {
  const connected = await getClient();
  return connected.db(process.env.MONGO_DB || 'qa');
}

export function getCollectionName(): string {
  return process.env.TESTS_COLLECTION || 'tests';
}

export async function closeClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
