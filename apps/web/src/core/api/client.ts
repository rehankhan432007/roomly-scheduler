import { ApiError, type ApiResponse, type ErrorCode } from '@meetmaze/shared/core';

export const apiClient = {
  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    
    // In browser, Next.js proxy or direct to API. Include credentials for cookies.
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (res.status === 204) return {} as T;

    const data: ApiResponse<T> = await res.json().catch(() => null);
    
    if (!data) {
      throw new ApiError(res.status, 'INTERNAL', 'Invalid response from server');
    }

    if (!data.success) {
      throw new ApiError(res.status, data.error.code, data.error.message, data.error.details);
    }

    return data.data;
  },

  get<T>(path: string, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) });
  },
  put<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },
  patch<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },
  delete<T>(path: string, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }
};
