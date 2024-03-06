import { createServer } from "http";
import { app } from "@/app";
import { config } from "@/config";
import { handler } from "@/utils/error/ErrorHandler";
import { logger } from "@/utils/logger";

const port = config.get("port") || 5000;
const server = createServer(app);

server.listen(port, () => {
    logger.info(`REST Server listening on port  ${port}`);
});

process.on("unhandledRejection", (reason: string, promise: Promise<any>) => {
    // I just caught an unhandled promise rejection,
    // since we already have fallback handler for unhandled errors (see below),
    // lets throw and let it handle that
    throw reason;
});
process.on("uncaughtException", (error: Error) => {
    handler.handleError(error);
});
