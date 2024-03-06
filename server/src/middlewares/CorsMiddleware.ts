import cors from "cors";
import { logger } from "@/utils/logger";

const whiteList = new Set(["http://localhost:5173"]);
const corsOptions = {
    optionsSuccessStatus: 200, // Some leagacy browser choke on 204
    origin: function (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void
    ) {
        if (!origin || whiteList.has(origin)) {
            callback(null, true);
        } else {
            logger.error(origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};
export const corsMiddleware = cors(corsOptions);
