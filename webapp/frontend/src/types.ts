export type Role = 'author' | 'promoter';
export type TestType = 'ui' | 'api';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface UiStep {
  action: string;
  selector?: string;
  value?: string;
  target?: string;
  key?: string;
  timeout?: number;
}

export interface ApiRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
}

export interface ApiAssertion {
  type: string;
  code?: number;
  value?: unknown;
  path?: string;
}

export interface TestDoc {
  id: string;
  type: TestType;
  name: string;
  enabled: boolean;
  tags?: string[];
  steps?: UiStep[];
  request?: ApiRequest;
  assertions?: ApiAssertion[];
  created_by?: string;
  // production-only
  version?: number;
  promoted_by?: string;
  source_id?: string;
}

export interface RunResult {
  test_id: string | null;
  name: string;
  type?: string;
  status: string;
  duration_ms?: number;
  error?: string | null;
}

export interface Run {
  id: string;
  source: 'draft' | 'production';
  test_ids: string[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  summary: { passed: number; failed: number; skipped: number };
  results: RunResult[];
  triggered_by: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
}
