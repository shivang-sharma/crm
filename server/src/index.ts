import { createServer } from "http";
import { app } from "@/app";
import { config } from "@/config";
import { handler } from "@/utils/error/ErrorHandler";
import { logger } from "@/utils/logger";
import { connectDB } from "@/database";

const connectionURI = config.get("db.uri");

if (connectionURI && connectionURI.trim().length > 0) {
    connectDB(connectionURI)
        .then(() => {
            const port = config.get("port") || 5000;
            const server = createServer(app);
            server.listen(port, () => {
                logger.info(`REST Server listening on port  ${port}`);
            });

            process.on(
                "unhandledRejection",
                (reason: string, promise: Promise<any>) => {
                    // I just caught an unhandled promise rejection,
                    // since we already have fallback handler for unhandled errors (see below),
                    // lets throw and let it handle that
                    throw reason;
                }
            );
            process.on("uncaughtException", (error: Error) => {
                handler.handleError(error);
            });
        })
        .catch((error: Error) => {
            logger.error(`MONGO db connection failed !!! ${error}`);
            process.exit(1);
        });
} else {
    logger.error(
        `MONGO DB connection URI not provided connectionURI: ${connectionURI}`
    );
}
