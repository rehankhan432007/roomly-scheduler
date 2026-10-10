// API client — wraps fetch, unwraps envelope, throws ApiError
import { ApiError } from '@meetmaze/shared/core';
import type { ErrorCode } from '@meetmaze/shared/core';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts?.headers,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal: opts?.signal,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || (json && !json.success)) {
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      (err.code as ErrorCode) ?? 'INTERNAL',
      err.message ?? 'Request failed',
      err.details,
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
};
