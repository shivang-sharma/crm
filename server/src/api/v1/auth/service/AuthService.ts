import { IUsers } from "@/database";
import {
    CreateNewUser,
    ExpireRefreshTokenById,
    FindOneUserById,
    FindOneUserByUsernameOrEmail,
} from "@/database/queries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";

export class AuthService {
    async signUpService(
        username: string,
        fname: string,
        lname: string,
        email: string,
        password: string
    ): Promise<SignUpServiceResult> {
        try {
            const result: SignUpServiceResult = {
                exist: false,
                failed: false,
                user: null,
            };
            const existedUser = await FindOneUserByUsernameOrEmail(
                username,
                email
            );
            if (existedUser) {
                logger.warn(
                    `User already exists ${JSON.stringify(existedUser)}`
                );
                result.exist = true;
                return result;
            }
            const user = await CreateNewUser(
                fname,
                lname,
                username,
                email,
                password
            );
            const createdUser = await FindOneUserById(user._id);
            if (!createdUser) {
                logger.warn(`User creation failed due to unknown reason`);
                result.failed = true;
                return result;
            }
            logger.warn(`User created successfully`);
            result.user = createdUser;
            return result;
        } catch (error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Something went wrong",
                true,
                [],
                `Name: ${(error as Error).name}
                 Message: ${(error as Error).message} 
                 Cause: ${(error as Error).cause}
                 Stack: ${(error as Error).stack}`
            );
        }
    }
    async loginService(
        email: string,
        password: string
    ): Promise<LoginServiceResult> {
        try {
            const result: LoginServiceResult = {
                doesNotExist: false,
                failed: false,
                accessToken: null,
                invalidCredentials: false,
                message: null,
                refreshToken: null,
                user: null,
            };
            const user = await FindOneUserByUsernameOrEmail("", email);
            if (!user) {
                result.doesNotExist = true;
                return result;
            }
            const isPasswordValid = await user.isPasswordCorrect(password);

            if (!isPasswordValid) {
                result.invalidCredentials = true;
                return result;
            }
            const { accessToken, refreshToken, error, message } =
                await this.generateAccessAndRefereshTokens(user);
            if (error) {
                result.failed = true;
                result.message = message;
                return result;
            }
            result.accessToken = accessToken;
            result.refreshToken = refreshToken;

            const loggedInUser = await FindOneUserById(user._id);
            result.user = loggedInUser;
            return result;
        } catch (error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Something went wrong",
                true,
                [],
                `Name: ${(error as Error).name}
                 Message: ${(error as Error).message} 
                 Cause: ${(error as Error).cause}
                 Stack: ${(error as Error).stack}`
            );
        }
    }
    async logoutService(userId: string) {
        try {
            await ExpireRefreshTokenById(userId);
        } catch (error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Something went wrong",
                true,
                [],
                `Name: ${(error as Error).name}
                 Message: ${(error as Error).message} 
                 Cause: ${(error as Error).cause}
                 Stack: ${(error as Error).stack}`
            );
        }
    }
    private async generateAccessAndRefereshTokens(user: IUsers) {
        const result: GenerateAccessAndRefereshTokensResult = {
            accessToken: "",
            refreshToken: "",
            error: false,
            message: "",
        };
        try {
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });
            result.accessToken = accessToken;
            result.refreshToken = refreshToken;
        } catch (error) {
            result.error = true;
            result.message = `Something went wrong while generating referesh and access token`;
        }
        return result;
    }
}

export type SignUpServiceResult = {
    exist: boolean;
    failed: boolean;
    user: IUsers | null;
};

export type LoginServiceResult = {
    failed: boolean;
    doesNotExist: boolean;
    invalidCredentials: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    message: string | null;
    user: IUsers | null;
};

export type GenerateAccessAndRefereshTokensResult = {
    accessToken: string;
    refreshToken: string;
    error: boolean;
    message: string;
};
