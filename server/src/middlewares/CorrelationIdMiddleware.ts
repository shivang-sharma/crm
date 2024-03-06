import type { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
export function correlationId(req: Request, res: Response, next: NextFunction) {
    res.setHeader("X-CorrelationId", uuid());
    next();
}
