import type { Response, NextFunction } from "express";
import type { CustomRequest } from "@/utils/CustomRequest";

export function asyncHandler(
    requestHandler: (
        req: CustomRequest,
        res: Response,
        next: NextFunction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Promise<Response<any, Record<string, any>> | undefined> | Promise<void>
) {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err)
        );
    };
}
