// Generic API test interpreter.
// Issues one HTTP request described by the document, then evaluates a fixed
// set of assertions against the response.

import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { ApiAssertion, ApiTestDoc } from '../types/testSchema';
import { resolve } from './resolve';

export async function run(request: APIRequestContext, def: ApiTestDoc): Promise<void> {
  const response = await sendRequest(request, def);
  for (const assertion of def.assertions ?? []) {
    await evaluate(response, assertion);
  }
}

async function sendRequest(
  request: APIRequestContext,
  def: ApiTestDoc
): Promise<APIResponse> {
  const { method, url, headers, params, body } = def.request;
  const resolvedUrl = resolve(url);
  const options = {
    headers,
    params,
    ...(body !== undefined && body !== null ? { data: body } : {}),
  };

  switch (method) {
    case 'get':
      return request.get(resolvedUrl, options);
    case 'post':
      return request.post(resolvedUrl, options);
    case 'put':
      return request.put(resolvedUrl, options);
    case 'patch':
      return request.patch(resolvedUrl, options);
    case 'delete':
      return request.delete(resolvedUrl, options);
    case 'head':
      return request.head(resolvedUrl, options);
    default:
      throw new Error(`Unsupported HTTP method "${method}".`);
  }
}

async function evaluate(response: APIResponse, assertion: ApiAssertion): Promise<void> {
  switch (assertion.type) {
    case 'expectOk':
      expect(response.ok()).toBeTruthy();
      return;
    case 'expectStatus':
      expect(response.status()).toBe(assertion.code);
      return;
    case 'expectBodyContains': {
      const text = await response.text();
      expect(text).toContain(assertion.value);
      return;
    }
    case 'expectJsonPath': {
      const json = await response.json();
      expect(getByPath(json, assertion.path)).toEqual(assertion.value);
      return;
    }
    default: {
      const unknown = assertion as { type?: string };
      throw new Error(`Unsupported API assertion "${unknown.type}".`);
    }
  }
}

/** Resolve a dotted path, e.g. "data.0.name", against a parsed JSON value. */
function getByPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, value);
}
