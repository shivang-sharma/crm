import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { AccountsService } from "../service/AccountsService";
import { ZCreateAccountInputSchema } from "../zschema/ZCreateAccountInputSchema";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZAccountId } from "../zschema/ZAccountId";
import { ZUpdateAccountInputSchema } from "../zschema/ZUpdateAccountInputSchema";

export class AccountsController {
    private service: AccountsService;
    constructor(service: AccountsService) {
        this.service = service;
    }
    CreateAccount = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `CreateNewAccount request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the CreateAccount request payload using zod schema, payload:${req.body}, correlationId:${correlationId}`
        );
        const validationResult = ZCreateAccountInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for CreateAccount request payload, errors: ${validationResult.error.errors} correlationId: ${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true
            );
        }
        if (user) {
            logger.info(
                `Validation successfull for CreateAccount request payload for correlationId:${correlationId}`
            );
            const { description, industry, name, size, priority, type } =
                validationResult.data;
            logger.info(
                `Attempting to call createAccountService for correlationId: ${correlationId}`
            );
            const result = await this.service.createAccountService(
                correlationId,
                user,
                description,
                industry,
                name,
                size,
                priority,
                type
            );
            logger.info(
                `Call to createAccountService service ended for correlationId: ${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have required privileges to perform action",
                    true
                );
            }
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.account,
                        "Account created successfully"
                    )
                );
        }
    };
    GetAllAccount = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetAllAccount request recieved for correlationId: ${correlationId}`
        );
        if (user) {
            logger.info(
                `Attempting to call getAllAccountsForCurrentOrgService correlationId:${correlationId}`
            );
            // TODO: Pagination and filter quries
            const result =
                await this.service.getAllAccountsForCurrentOrgService(
                    correlationId,
                    user
                );
            logger.info(
                `Call to getAllAccountsForCurrentOrgService ended successfully correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.accounts,
                        "Successfully retrieved all the accounts associated with the current organisation"
                    )
                );
        }
    };
    GetOneAccount = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetOneAccount request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetOneAccount request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZAccountId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneAccount request params, error: ${JSON.stringify(
                    validationResult.error.errors
                )}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        if (user) {
            const { accountId } = validationResult.data;
            logger.info(
                `Validation successfull for GetOneAccount request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call getOneAccountService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneAccountService(
                correlationId,
                user,
                accountId
            );
            logger.info(
                `Call to getOneAccountService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Account not found",
                    true
                );
            }
            if (result.accountBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Account belongs to a different org, access denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.account,
                        "Account found"
                    )
                );
        }
    };
    UpdateAccount = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `UpdateAccount request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the UpdateAccount request payload using zod schema, payload: ${req.body} correlationId: ${correlationId}`
        );
        const validationResult = ZUpdateAccountInputSchema.safeParse({
            ...req.body,
            ...req.params,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for UpdateAccount request payload, error: ${JSON.stringify(
                    validationResult.error.errors
                )} correlationId:${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        if (user) {
            const {
                accountId,
                description,
                industry,
                name,
                priority,
                size,
                type,
            } = validationResult.data;
            logger.info(
                `Validation successfull for UpdateAccount request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call updateAccountService for correlationId: ${correlationId}`
            );
            const result = await this.service.updateAccountService(
                correlationId,
                user,
                accountId,
                description,
                industry,
                name,
                priority,
                size,
                type
            );
            logger.info(
                `Call to updateAccountService service ended for correlationId: ${correlationId}`
            );
            if (result.accountBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Account belong to a different organisation, action denied",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have enough privileges to perform action",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Account does not exist",
                    true
                );
            }
            logger.info(
                `Successfully updated the account for correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.account,
                        "Successfully updated the account"
                    )
                );
        }
    };
    DeleteAccount = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `DeleteAccount request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the DeleteAccount request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZAccountId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for DeleteAccount request params, error: ${JSON.stringify(
                    validationResult.error.errors
                )}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        if (user) {
            const { accountId } = validationResult.data;
            logger.info(
                `Validation successfull for DeleteAccount request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call deleteOneAccountService for correlationId: ${correlationId}`
            );
            const result = await this.service.deleteOneAccountService(
                correlationId,
                user,
                accountId
            );
            logger.info(
                `Call to deleteOneAccountService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Account not found",
                    true
                );
            }
            if (result.accountBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Account belongs to a different org, access denied",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have enough privileges for the action",
                    true
                );
            }
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete for unknown reason",
                    true
                );
            }
            logger.info(
                `Account deleted successfully correlaionId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.account,
                        "Account Deleted"
                    )
                );
        }
    };
}
