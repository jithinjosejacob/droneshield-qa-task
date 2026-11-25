import axios from 'axios';
import type { Run, TestDoc, User, Role } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({ baseURL: API_URL });

const TOKEN_KEY = 'dstm_token';

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- typed calls -------------------------------------------------------------

export async function login(username: string, password: string) {
  const form = new URLSearchParams({ username, password });
  const { data } = await api.post('/auth/login', form);
  return data as { access_token: string; role: Role; username: string };
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data as User;
}

export async function listTests(type?: string) {
  const { data } = await api.get('/tests', { params: type ? { type } : {} });
  return data as TestDoc[];
}

export async function getTest(id: string) {
  const { data } = await api.get(`/tests/${id}`);
  return data as TestDoc;
}

export async function createTest(payload: unknown) {
  const { data } = await api.post('/tests', payload);
  return data as TestDoc;
}

export async function updateTest(id: string, payload: unknown) {
  const { data } = await api.put(`/tests/${id}`, payload);
  return data as TestDoc;
}

export async function deleteTest(id: string) {
  await api.delete(`/tests/${id}`);
}

export async function promoteTest(id: string) {
  const { data } = await api.post(`/tests/${id}/promote`);
  return data as TestDoc;
}

export async function listProduction() {
  const { data } = await api.get('/production');
  return data as TestDoc[];
}

export async function unpublish(id: string) {
  await api.delete(`/production/${id}`);
}

export async function createRun(source: 'draft' | 'production', testIds: string[]) {
  const { data } = await api.post('/runs', { source, test_ids: testIds });
  return data as Run;
}

export async function listRuns() {
  const { data } = await api.get('/runs');
  return data as Run[];
}

export async function getRun(id: string) {
  const { data } = await api.get(`/runs/${id}`);
  return data as Run;
}

export async function downloadRunReport(id: string, format: 'html' | 'csv' | 'json') {
  // Fetch as a blob so the axios interceptor can attach the JWT (a plain
  // <a href> download could not send the Authorization header).
  const res = await api.get(`/runs/${id}/report`, {
    params: { format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `run-${id}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function listUsers() {
  const { data } = await api.get('/users');
  return data as User[];
}

export async function createUser(username: string, password: string, role: Role) {
  const { data } = await api.post('/users', { username, password, role });
  return data as User;
}

export async function updateUserRole(id: string, role: Role) {
  const { data } = await api.put(`/users/${id}/role`, { role });
  return data as User;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
