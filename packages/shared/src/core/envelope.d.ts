export type Iso = string;
export interface ApiSuccess<T> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
    };
}
export interface ApiFailure {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: unknown;
    };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export type ErrorCode = 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'SLOT_UNAVAILABLE' | 'HOLD_EXPIRED' | 'CHECKIN_WINDOW' | 'RATE_LIMITED' | 'INTERNAL';
//# sourceMappingURL=envelope.d.ts.map