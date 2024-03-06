import express from "express";
import type { NextFunction, Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import hpp from "hpp";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import { correlationId } from "@/middlewares/CorrelationIdMiddleware";
import { corsMiddleware } from "@/middlewares/CorsMiddleware";
import { ApiError } from "@/utils/error/ApiError";
import { CustomRequest } from "@/utils/CustomRequest";
import { handler } from "@/utils/error/ErrorHandler";
import { logger } from "@/utils/logger";

// import { ApiV1Router } from "./components/v1";

export const app = express();

// TODO: Use node-rate-limiter-flexible
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100,
    })
);

app.use(correlationId);
app.disable("x-powered-by");
app.use(compression());
app.use(helmet());
app.use(
    pinoHttp({
        logger: logger,
        genReqId: (req: Request, res: Response) => {
            const correlationId = res.getHeader("X-CorrelationId");
            return correlationId as string;
        },
    })
);
// important if behind a proxy to ensure client IP is passed to req.ip
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(hpp());
app.options("*", corsMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());

// app.use("/api/v1", ApiV1Router);
app.get("/", (req: Request, res: Response) => res.send("It works! Changed"));

/**
 * Global Error Handler
 */

app.use(
    (
        error: ApiError | Error,
        req: CustomRequest | Request,
        res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: NextFunction
    ) => {
        handler.handleError(error, res);
    }
);
