import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { AuthService } from "../service/AuthService";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZSignUpInputSchema } from "../zschema/ZSignUpInputSchema";
import { ZLoginInputSchema } from "../zschema/ZLoginInputSchema";

export class AuthController {
    private service: AuthService;
    constructor(service: AuthService) {
        this.service = service;
    }
    SignUp = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId");
        logger.info(
            `SignUp request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the SignUp request payload using zod schema, payload: ${req.body} correlationId: ${correlationId}`
        );
        const validationResult = ZSignUpInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for signup request payload error ${JSON.stringify(
                    validationResult.error.errors
                )} corrleationId: ${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        const { email, name, password, username } = validationResult.data;
        logger.info(
            `Validation successfull for signup request payload for correlationId: ${correlationId}`
        );
        logger.info(
            `Attempting to call signUpService for correlationId: ${correlationId}`
        );
        const result = await this.service.signUpService(
            username,
            name,
            email,
            password
        );
        logger.info(
            `Call to signup service ended for correlationId: ${correlationId}`
        );
        if (result.exist) {
            logger.error(
                `User with email of username already exists for correlationId: ${correlationId}`
            );
            throw new ApiError(
                StatusCodes.CONFLICT,
                "User with email or username already exists",
                true
            );
        }
        if (result.failed) {
            logger.error(
                `Something went wrong while registering the user for correlationId: ${correlationId}`
            );
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Something went wrong while registering the user",
                true
            );
        }
        logger.info(
            `User registered Successfully user: ${result.user?.toJSON()} for correlationId: ${correlationId}`
        );
        return res
            .status(StatusCodes.CREATED)
            .json(
                new ApiResponse(
                    StatusCodes.OK,
                    result.user,
                    "User registered Successfully"
                )
            );
    };
    Login = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId");
        logger.info(
            `Login request recieved for correlationId: ${correlationId}`
        );
        const loginInput = {
            email: req.body.email,
            password: req.body.password,
        };
        logger.info(
            `Validating the login request payload using zod schema for correlationId: ${correlationId}`
        );
        const validationResult = ZLoginInputSchema.safeParse(loginInput);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for login request payload error ${JSON.stringify(
                    validationResult.error.errors
                )} corrleationId: ${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        const { email, password } = validationResult.data;
        logger.info(
            `Validation successfull for login request payload for correlationId: ${correlationId}`
        );
        logger.info(
            `Attempting to call loginService for correlationId: ${correlationId}`
        );
        const result = await this.service.loginService(email, password);
        if (result.doesNotExist) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "User does not exist",
                true
            );
        }
        if (result.invalidCredentials) {
            throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Invalid user credentials",
                true
            );
        }
        if (result.failed && result.message) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                result.message,
                true
            );
        }
        const options = {
            httpOnly: true,
            secure: true,
        };
        return res
            .status(200)
            .cookie("accessToken", result.accessToken, options)
            .cookie("refreshToken", result.refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: result.user,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    },
                    "User logged In Successfully"
                )
            );
    };
    Logout = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId");
        logger.info(
            `Logout request recieved for correlationId: ${correlationId}`
        );
        if (req.user) {
            await this.service.logoutService(req.user._id);
            const options = {
                httpOnly: true,
                secure: true,
            };
            return res
                .status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(new ApiResponse(200, {}, "User logged Out"));
        }
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", true);
    };
}
