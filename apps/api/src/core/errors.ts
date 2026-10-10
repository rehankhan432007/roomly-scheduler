// Custom error classes for the API
import { ApiError } from '@meetmaze/shared/core';

export { ApiError };

export function notFound(message = 'Resource not found'): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function unauthorized(message = 'Authentication required'): ApiError {
  return new ApiError(401, 'UNAUTHENTICATED', message);
}

export function forbidden(message = 'Access denied'): ApiError {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function conflict(message: string, details?: unknown): ApiError {
  return new ApiError(409, 'CONFLICT', message, details);
}

export function validationError(message: string, details?: unknown): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', message, details);
}
