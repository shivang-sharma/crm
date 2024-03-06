import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";

export function crashIfUntrustedErrorOrSendResponse(
    error: ApiError | Error,
    res: Response | undefined
) {
    if (error instanceof ApiError) {
        if (res) {
            res.status(error.statusCode).json({
                error: error.errors,
                message: error.message,
            });
        }
        if (!error.isOperational) {
            process.exit(1);
        }
    } else if (error instanceof Error) {
        if (res) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Something went wrong",
            });
        }
    }
    return;
}

export function logError(
    error: ApiError | Error,
    correlationId: string | undefined
) {
    if (error instanceof ApiError) {
        logger.error(
            `Error occured for correlationId: ${correlationId} name: ${
                error.name
            } message: ${error.message} cause: ${error.cause} data: ${
                error.data
            } errors: ${JSON.stringify(error.errors)} stack: ${JSON.stringify(
                error.stack
            )} statusCode: ${error.statusCode} success: ${error.success}`
        );
    } else if (error instanceof Error) {
        logger.error(
            `Error occured for correlationId: ${correlationId} name: ${
                error.name
            } message: ${error.message} cause: ${
                error.cause
            } stack: ${JSON.stringify(error.stack)} `
        );
    }
}

export function fireMonitoringMetric(
    error: ApiError | Error,
    correlationId: string
) {
    logger.debug(error.name);
    logger.debug(correlationId);
}
