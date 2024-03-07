import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/error/ApiError";
import { Users } from "@/database";
import type { CustomRequest } from "@/utils/CustomRequest";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/utils/logger";
import { config } from "@/config";

export const authenticate = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        logger.debug(token);
        if (!token) {
            throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Unauthorized request",
                true
            );
        }

        const decodedToken = jwt.verify(
            token,
            config.get("accessTokenSecret") || "secrete"
        );

        const user = await Users.findById(
            (decodedToken as jwt.JwtPayload)?._id
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Invalid Access Token",
                true
            );
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            (error as Error).message || "Invalid access token",
            true
        );
    }
};
