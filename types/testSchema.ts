// Shared type definitions for DB-driven tests.
// A "test" is a plain document stored in MongoDB and fetched at run time.
// Nothing here is executable code — the engine only dispatches a fixed action set.

export type TestType = 'ui' | 'api';

/** A single UI action interpreted by the uiExecutor. */
export type UiStep =
  | { action: 'goto'; target: string }
  | { action: 'fill'; selector: string; value: string }
  | { action: 'type'; selector: string; value: string }
  | { action: 'click'; selector: string }
  | { action: 'check'; selector: string }
  | { action: 'selectOption'; selector: string; value: string }
  | { action: 'press'; selector: string; key: string }
  | { action: 'waitFor'; selector?: string; timeout?: number }
  | { action: 'expectVisible'; selector: string }
  | { action: 'expectHidden'; selector: string }
  | { action: 'expectText'; selector: string; value: string }
  | { action: 'expectUrl'; value: string };

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';

export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
}

/** A single API assertion evaluated by the apiExecutor. */
export type ApiAssertion =
  | { type: 'expectOk' }
  | { type: 'expectStatus'; code: number }
  | { type: 'expectBodyContains'; value: string }
  | { type: 'expectJsonPath'; path: string; value: unknown };

interface BaseDoc {
  /** Mongo _id serialised to string by fetchTests. Optional in seed input. */
  _id?: string;
  name: string;
  enabled: boolean;
  tags?: string[];
}

export interface UiTestDoc extends BaseDoc {
  type: 'ui';
  steps: UiStep[];
}

export interface ApiTestDoc extends BaseDoc {
  type: 'api';
  request: ApiRequest;
  assertions: ApiAssertion[];
}

export type TestDoc = UiTestDoc | ApiTestDoc;
