import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { DealsService } from "../service/DealsService";
import { ZCreateDealInputSchema } from "../zschema/ZCreateDealInputSchema";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZDealId } from "../zschema/ZDealId";
import { ZUpdateDealInputSchema } from "../zschema/ZUpdateDealInputSchema";
import { ZGetAllDealsInputSchema } from "../zschema/ZGetAllDealsInputSchema";

export class DealsController {
    private service: DealsService;
    constructor(service: DealsService) {
        this.service = service;
    }
    CreateDeal = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `CreateDeal request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the CreateDeal request payload, payload:${req.body} for correlationId: ${correlationId}`
        );
        const validationResult = ZCreateDealInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            const {
                account,
                contacts,
                name,
                owner,
                value,
                actualValue,
                closeProbability,
                closedAt,
                expectedCloseDate,
                priority,
                stage,
            } = validationResult.data;
            logger.info(
                `Validation successfull for the CreateDeal request correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call createDealService for correlationId:${correlationId}`
            );
            const result = await this.service.createDealService(
                correlationId,
                currentUser,
                account,
                contacts,
                name,
                owner,
                value,
                actualValue,
                closeProbability,
                closedAt,
                expectedCloseDate,
                priority,
                stage
            );
            if (result.anotherDealExistsWithSameName) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Another deal exist with same name",
                    true
                );
            }
            if (result.notAssociatedWithAnyOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User is not associated with any org, action denied",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not sufficient privileges to perform action, action denied",
                    true
                );
            }
            if (result.assignedOwnerNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned owner not found",
                    true
                );
            }
            if (result.assignedOwnerBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Assigned owner belongs to different organisation, action denied",
                    true
                );
            }
            if (result.assignedAccountNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned account not found",
                    true
                );
            }
            if (result.assignedAccountBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Assigned account belongs to different organisation, action denied",
                    true
                );
            }
            if (result.someContactsNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "One or more contacts not found",
                    true
                );
            }
            if (result.someContactsBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "One or more contacts belongs to different organisation, action denied",
                    true
                );
            }
            logger.info(
                `Successfully created deal for correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.deal,
                        "Successfully created deal"
                    )
                );
        }
    };
    GetAllDeals = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `GetAllDeals request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetAllDeals request payload, payload:${req.query} for correlationId:${correlationId}`
        );
        const validationResult = ZGetAllDealsInputSchema.safeParse(req.query);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetAllDeals request payload, errors:${validationResult.error.errors} for correlationId:${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            const {
                account,
                close_probability_gt,
                close_probability_lt,
                name,
                owner,
                priority,
                stage,
                value_gt,
                value_lt,
                limit,
                page,
            } = validationResult.data;
            logger.info(
                `Validation successfull for GenAllDeals request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call getAllDealsForCurrentOrgService correlationId:${correlationId}`
            );
            // TODO: Pagination and filter quries
            const result = await this.service.getAllDealsForCurrentOrgService(
                correlationId,
                currentUser,
                account,
                close_probability_gt,
                close_probability_lt,
                name,
                owner,
                priority,
                stage,
                value_gt,
                value_lt,
                parseInt(limit),
                parseInt(page)
            );
            logger.info(
                `Call to getAllDealsForCurrentOrgService ended successfully correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.deals,
                        "Successfully retrieved all the deals associated with the current organisation"
                    )
                );
        }
    };
    GetOneDeal = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `GetOneDeal request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetOneDeal request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZDealId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneDeal request params, error: ${JSON.stringify(
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
            const { dealId } = validationResult.data;
            logger.info(
                `Validation successfull for  GetOneDeal request payload for correlatinId:${correlationId}`
            );
            logger.info(
                `Attempting to call getOneDealService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneDealService(
                correlationId,
                currentUser,
                dealId
            );
            logger.info(
                `Call to getOneDealService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Deal not found",
                    true
                );
            }
            if (result.dealBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Deal belongs to a different org, access denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(StatusCodes.OK, result.deal, "Deal found")
                );
        }
    };
    UpdateDeal = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `UpdateDeal request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the UpdateDeal request payload, payload:${{
                ...req.params,
                ...req.body,
            }} for correlationId:${correlationId}`
        );
        const validationResult = ZUpdateDealInputSchema.safeParse({
            ...req.params,
            ...req.body,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for UpdateDeal errors: ${validationResult.error.errors} correlationId:${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid input",
                true,
                validationResult.error.errors
            );
        }
        if (currentUser) {
            const {
                dealId,
                actualValue,
                closeProbability,
                closedAt,
                contacts,
                expectedCloseDate,
                name,
                owner,
                priority,
                stage,
                value,
            } = validationResult.data;
            logger.info(
                `Validation successfull for UpdateDeal request payload for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call updateDealService for correlationId:${correlationId}`
            );
            const result = await this.service.updateDealService(
                correlationId,
                currentUser,
                dealId,
                actualValue,
                closeProbability,
                closedAt,
                contacts,
                expectedCloseDate,
                name,
                owner,
                priority,
                stage,
                value
            );
            logger.info(
                `Call to updateDealService ended for correlatioId:${correlationId}`
            );
            if (result.anotherDealExistsWithSameName) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Another deal exist with same name",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not sufficient privileges to perform action, action denied",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Deal not found",
                    true
                );
            }
            if (result.dealBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Deal belongs to different organisation, action denied",
                    true
                );
            }
            if (result.assignedOwnerNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned owner not found",
                    true
                );
            }
            if (result.assignedOwnerBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Assigned owner belongs to different organisation, action denied",
                    true
                );
            }
            if (result.someContactsNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "One or more contacts not found",
                    true
                );
            }
            if (result.someContactsBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "One or more contacts belongs to different organisation, action denied",
                    true
                );
            }
            logger.info(
                `Successfully updated deal for correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.deal,
                        "Successfully updated deal"
                    )
                );
        }
    };
    DeleteDeal = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const currentUser = req.user;
        logger.info(
            `DeleteDeal request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the DeleteDeal request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZDealId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for DeleteDeal request params, error: ${JSON.stringify(
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
            const { dealId } = validationResult.data;
            logger.info(
                `Validation successfull for  DeleteDeal request payload for correlatinId:${correlationId}`
            );
            logger.info(
                `Attempting to call deleteOneDealService for correlationId: ${correlationId}`
            );
            const result = await this.service.deleteOneDealService(
                correlationId,
                currentUser,
                dealId
            );
            logger.info(
                `Call to deleteOneDealService ended for correlationId:${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have sufficient privileges to perform action, action denied",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Deal not found",
                    true
                );
            }
            if (result.dealBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Deal belongs to a different organisation, action denied",
                    true
                );
            }
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete deal for unknown reason",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.deal,
                        "Deal deleted successfully"
                    )
                );
        }
    };
}
