/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiError extends Error {
    statusCode: number;
    data: unknown;
    message: string;
    success: boolean;
    errors: any[];
    stack?: string | undefined;
    isOperational: boolean;
    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: any[] = [],
        stack = "",
        isOperational: boolean
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}