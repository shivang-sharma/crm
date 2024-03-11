import { type Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { UsersService } from "../service/UsersService";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZUserId } from "../zschema/ZUserId";
import { ApiError } from "@/utils/error/ApiError";
import { ZChangeRoleInputSchema } from "../zschema/ZChangeRoleInputSchema";
import { ZUpdateUserInputSchema } from "../zschema/ZUpdateUserInputSchema";
import { ZGetAllUserInputSchema } from "../zschema/ZGetAllUserInputSchema";

export class UsersController {
    private service: UsersService;
    constructor(service: UsersService) {
        this.service = service;
    }
    GetAllUsers = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `GetAllUsers request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetAllUsers request payload, payload ${JSON.stringify(req.params)} for correlationId:${correlationId}`
        );
        const validationResult = ZGetAllUserInputSchema.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetAllUsers request payload errors:${JSON.stringify(validationResult.error.errors)} for correlationId:${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            const { limit, page, email, username } = validationResult.data;
            logger.info(
                `Validation for GetAllUsers payload is successfull for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call getAllUsersForCurrentOrgService correlationId:${correlationId}`
            );
            const result = await this.service.getAllUsersForCurrentOrgService(
                correlationId,
                currentUser,
                limit,
                page,
                email,
                username
            );
            logger.info(
                `Call to getAllUsersForCurrentOrgService ended successfully correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.users,
                        "Successfully retrieved all the users associated with the current organisation"
                    )
                );
        }
    };
    GetOneUser = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `GetOneUser request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetOneUser request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZUserId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneUser request params, error: ${JSON.stringify(
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
        if (currentUser) {
            const { userId } = validationResult.data;
            logger.info(
                `Validation successfull for GetOneUser request for correlationId:${correlationId}`
            );
            if (currentUser.id === userId) {
                return res
                    .status(StatusCodes.OK)
                    .json(
                        new ApiResponse(
                            StatusCodes.OK,
                            currentUser,
                            "Successfully found user"
                        )
                    );
            }
            logger.info(
                `Attempting to call getOneUserService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneUserService(
                correlationId,
                currentUser,
                userId
            );
            logger.info(
                `Call to getOneUserService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "User not found",
                    true
                );
            }
            if (result.userBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User belongs to a different organisation, access denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(StatusCodes.OK, result.user, "User found")
                );
        }
    };
    ChangeRole = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `ChangeRole request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the ChangeRole request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZChangeRoleInputSchema.safeParse({
            ...req.body,
            ...req.params,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for ChangeRole request payload, error: ${JSON.stringify(
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
        if (currentUser) {
            const { role, userId } = validationResult.data;
            logger.info(
                `Validation successfull for ChangeRole request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting call to changeRoleService for correlationId:${correlationId}`
            );
            const result = await this.service.changeRoleService(
                correlationId,
                currentUser,
                userId,
                role
            );
            logger.info(
                `Call to changeRoleService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "User not found",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privileges to perofrm the action, action denied",
                    true
                );
            }
            if (result.userBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User belongs to the different organisation, action denied",
                    true
                );
            }
            logger.info(
                `Successfully changed the role for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.user,
                        "Successfully changed the role"
                    )
                );
        }
    };
    RemoveFromOrganisation = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `RemoveFromOrganisation request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the RemoveFromOrganisation request payload, ${req.params} for correlationId:${correlationId}`
        );
        const validationResult = ZUserId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for RemoveFromOrganisation request params, error: ${JSON.stringify(
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
        if (currentUser) {
            const { userId } = validationResult.data;
            logger.info(
                `Validation successfull for RemoveFromOrganisation request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call removeFromOrganisationService for correlationId:${correlationId}`
            );
            const result = await this.service.removeFromOrganisationService(
                correlationId,
                currentUser,
                userId
            );
            logger.info(
                `Call to removeFromOrganisationService ended for correlatinId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "User not found",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User not authorized to perform action, action denied",
                    true
                );
            }
            if (result.userBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User belongs to a different organisation, action denied",
                    true
                );
            }
            return res.status(StatusCodes.OK).json(
                new ApiResponse(
                    StatusCodes.OK,
                    {
                        updatedUser: result.user,
                        noOfLeadsModified: result.noOfLeadsModified,
                    },
                    "Successfully removed user from organisation"
                )
            );
        }
    };
    UpdateUser = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `UpdateUser request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the UpdateUser request payload, payload:${{
                ...req.body,
                ...req.params,
            }} correlationId:${correlationId}`
        );
        const validationResult = ZUpdateUserInputSchema.safeParse({
            ...req.params,
            ...req.body,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for UpdateUser request payload, error: ${JSON.stringify(
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
        if (currentUser) {
            const { userId, name } = validationResult.data;
            logger.info(
                `Validation successfull for UpdateUser request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call updateUserService for correlationId: ${correlationId}`
            );
            const result = await this.service.updateUserService(
                correlationId,
                currentUser,
                userId,
                name
            );
            logger.info(
                `Call to updateUserService service ended for correlationId: ${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privileges to performt the action, action denied",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "User not found",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.user,
                        "Updated user successfully"
                    )
                );
        }
    };
    DeleteUser = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `DeleteUser request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the DeleteUser request payload for correlationId:${correlationId}`
        );
        const validationResult = ZUserId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(`Validation failed for DeleteUser`);
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Input is invalid",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            logger.info(
                `Validation of DeleteUser payload is successfull for correlationId:${correlationId}`
            );
            const { userId } = validationResult.data;
            logger.info(
                `Attempting to call deleteUserService for correlationId:${correlationId}`
            );
            const result = await this.service.deleteUserService(
                correlationId,
                currentUser,
                userId
            );
            logger.info(
                `Call to deleteUserService ended for correlationId:${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privilleges to perform action, action denied",
                    true
                );
            }
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete user due to unknown reason",
                    true
                );
            }
            return res.status(StatusCodes.OK).json(
                new ApiResponse(
                    StatusCodes.OK,
                    {
                        user: result.user,
                        noOfLeadsModified: result.noOfLeadsModified,
                    },
                    "Successfully delete the user"
                )
            );
        }
    };
}
