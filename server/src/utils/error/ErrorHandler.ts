import type { Response } from "express";
import {
    logError,
    crashIfUntrustedErrorOrSendResponse,
    fireMonitoringMetric,
} from "@/utils/error/ErrorUtil";
import { ApiError } from "@/utils/error/ApiError";

class ErrorHandler {
    public async handleError(
        error: ApiError | Error,
        res?: Response
    ): Promise<void> {
        logError(
            error,
            res ? (res.getHeader("X-CorrelationId") as string) : undefined
        );
        fireMonitoringMetric(
            error,
            res?.getHeader("X-CorrelationId") as string
        );
        crashIfUntrustedErrorOrSendResponse(error, res);
        //sendMailToAdminIfCritical
    }
}
export const handler = new ErrorHandler();
