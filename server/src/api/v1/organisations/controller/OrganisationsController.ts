import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { OrganisationsService } from "../service/OrganisationsService";
import { ZCreateOrgInputSchema } from "../zschema/ZCreateOrgInputSchema";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ZOrganisationId } from "../zschema/ZOrganisationId";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZChangeOwnerInputSchema } from "../zschema/ZChangeOwnerInputSchema";

export class OrganisationsController {
    private service: OrganisationsService;
    constructor(service: OrganisationsService) {
        this.service = service;
    }
    CreateOrganisation = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `CreateOrganisation request recieved for correlationId: ${correlationId}`
        );
        const createOrgInput = {
            name: req.body.name,
        };
        logger.info(
            `Validating the CreateOrganisation request payload using zod schema, payload: ${createOrgInput} correlationId: ${correlationId}`
        );
        const validationResult =
            ZCreateOrgInputSchema.safeParse(createOrgInput);

        if (!validationResult.success) {
            logger.warn(
                `Validation failed for CreateOrganisation request payload, error: ${JSON.stringify(
                    validationResult.error.errors
                )} correlationId: ${correlationId}`
            );

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            const { name } = validationResult.data;
            logger.info(
                `Validation successfull for CreateOrganisation request payload for correlationId: ${correlationId}`
            );
            logger.info(
                `Attempting to call createOrganisationService for correlationId: ${correlationId}`
            );
            const result = await this.service.createOrganisationService(
                correlationId,
                currentUser,
                name
            );
            logger.info(
                `Call to createOrganisationService service ended for correlationId: ${correlationId}`
            );
            if (result.failed) {
                if (result.alreadyAssociatedWithOrg) {
                    logger.error(
                        `User is already associated with an organisation, correlationId: ${correlationId}`
                    );
                    throw new ApiError(
                        StatusCodes.CONFLICT,
                        "User is already associated with an organisation cannot create another org",
                        true
                    );
                }
                logger.error(
                    `Something went wrong while creatign the org user for correlationId: ${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Something went wrong while registering the user",
                    true
                );
            }
            logger.info(
                `Organisation created successfully organisation: ${result.org?.toJSON()} for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.org,
                        "Organisation created successfully"
                    )
                );
        }
    };
    GetOneOrganisation = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `GetOneOrganisation request recieved for correlationId: ${correlationId}`
        );
        const params = {
            organisationId: req.params.organisationId,
        };
        logger.info(
            `Validating the GetOneOrganisation request payload using zod schema, URL param: ${params} correlationId: ${correlationId}`
        );
        const validationResult = ZOrganisationId.safeParse(params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneOrganisation request parameter, error ${JSON.stringify(
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
        if (currentUser) {
            const { organisationId } = validationResult.data;
            logger.info(
                `Validation successfull for GetOneOrganisation request payload for correlationId: ${correlationId}`
            );
            logger.info(
                `Attempting to call getOneOrganisationService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneOrganisationService(
                correlationId,
                currentUser,
                organisationId
            );
            logger.info(
                `Call to getOneOrganisationService ended for correlationId: ${correlationId}`
            );
            if (result.notAuthorized) {
                logger.error(
                    `User is not associated with the organisation, access denied correlationId: ${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User is not associated with the organisation, access denied",
                    true
                );
            }
            if (result.notFound) {
                logger.error(
                    `Organisation not found correlationId: ${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Organisation not found",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.org,
                        "Organisation found"
                    )
                );
        }
    };
    ChangeOwner = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `ChangeOwner request recieved for correlationId: ${correlationId}`
        );
        const payload = {
            organisationId: req.params.organisationId,
            newOwner: req.body.newOwner,
        };
        logger.info(
            `Validating the ChangeOwner request payload using zod schema, payload: ${payload} correlationId: ${correlationId}`
        );
        const validationResult = ZChangeOwnerInputSchema.safeParse(payload);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for ChangeOwner request payload, error: ${JSON.stringify(
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
            const { newOwner, organisationId } = validationResult.data;
            logger.info(
                `Validation successfull for ChangeOwner request payload for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call changeOwnerService for ChangeOwner request payload for correlationId:${correlationId}`
            );
            const result = await this.service.changeOwnerService(
                correlationId,
                currentUser,
                organisationId,
                newOwner
            );
            logger.info(
                `Call to changeOwnerService ended for correlationId:${correlationId}`
            );
            if (result.notAuthorized) {
                logger.error(
                    `User does not have sufficient privileges to change the org owner role:${currentUser.role}, user.organisation:${currentUser.organisation}, organisation:${organisationId}, for correlationId:${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privileges to change the org owner",
                    true
                );
            }
            if (result.organisationNotFound) {
                logger.error(
                    `Organisation does not exist organisationId:${organisationId} for correlationId:${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Organisation does not exist",
                    true
                );
            }
            if (result.newOwnerNotFound) {
                logger.error(
                    `NewOwner does not exist newOwnerId:${newOwner} for correlationId:${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "NewOwner does not exist",
                    true
                );
            }
            if (result.newOwnerBelongToDifferentOrg) {
                logger.error(
                    `NewOwner belong to a different organisation for correlationId:${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "NewOwner belongs to a different organisation",
                    true
                );
            }
            if (result.failed) {
                logger.error(
                    `Failed to change owner for unknown reason for correlationId:${correlationId}`
                );
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to change owner for unknown reason",
                    true
                );
            }
            logger.info(
                `Successfully chnaged the owner of the organisation: ${result.org}, newOwner:${result.newOwner} for correlationId:${correlationId}`
            );
            return res.status(StatusCodes.OK).json(
                new ApiResponse(
                    StatusCodes.OK,
                    {
                        organisation: result.org,
                        newOwner: result.newOwner,
                    },
                    "Successfully changed the owner"
                )
            );
        }
    };
    DeleteOrganisation = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `DeleteOrganisation request recieved for correlationId: ${correlationId}`
        );
        const params = {
            organisationId: req.params.organisationId,
        };
        logger.info(
            `Validating the DeleteOrganisation request payload using zod schema, URL param: ${params} correlationId: ${correlationId}`
        );
        const validationResult = ZOrganisationId.safeParse(params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for DeleteOrganisation request parameter, error ${JSON.stringify(
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
        if (currentUser) {
            const { organisationId } = validationResult.data;
            logger.info(
                `Validation successfull for DeleteOrganisation request payload for correlationId: ${correlationId}`
            );
            logger.info(
                `Attempting to call deleteOrganisationService for correlationId: ${correlationId}`
            );
            const result = await this.service.deleteOrganisationService(
                correlationId,
                currentUser,
                organisationId
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Organisation not found",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privileges to perform the action, action denied",
                    true
                );
            }
            if (result.userDoesNotBelongToTheOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not belong to the organisation, action denied",
                    true
                );
            }
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete for some unknown reason",
                    true
                );
            }
            logger.info(
                `Successfully delete the organisation for correlationId:${correlationId}`
            );
            return res.status(StatusCodes.OK).json(
                new ApiResponse(StatusCodes.OK, {
                    deletedOrgnisation: result.deletedOrganisation,
                    noOfAccountsDeleted: result.noOfAccountsDeleted,
                    noOfContactsDeleted: result.noOfContactsDeleted,
                    noOfDealsDeleted: result.noOfDealsDeleted,
                    noOfLeadsDeleted: result.noOfLeadsDeleted,
                    noOfUserRemovedFromOrg: result.noOfUserRemovedFromOrg,
                })
            );
        }
    };
}
