import type { ErrorCode } from './envelope.js';
export declare class ApiError extends Error {
    status: number;
    code: ErrorCode;
    details?: unknown | undefined;
    constructor(status: number, code: ErrorCode, message: string, details?: unknown | undefined);
}
//# sourceMappingURL=errors.d.ts.map