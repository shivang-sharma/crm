import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { LeadsService } from "../service/LeadsService";
import { ZCreateLeadInputSchema } from "../zschema/ZCreateLeadInputSchema";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZLeadId } from "../zschema/ZLeadId";
import { ZChangeStatusInputSchema } from "../zschema/ZChangeStatusInputSchema";
import { ZUpdateLeadInputSchema } from "../zschema/ZUpdateLeadInputSchema";

export class LeadsController {
    private service: LeadsService;
    constructor(service: LeadsService) {
        this.service = service;
    }
    CreateLead = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `CreateLead request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the CreateLead request payload using zod schema, payload:${req.body}, correlationId:${correlationId}`
        );
        const validationResult = ZCreateLeadInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for CreateLead request payload, errors: ${JSON.stringify(
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
        if (user) {
            logger.info(
                `Validation successfull for CreateLead request payload for correlationId: ${correlationId}`
            );
            const {
                company,
                email,
                name,
                phone,
                comments,
                location,
                owner,
                status,
                title,
            } = validationResult.data;
            logger.info(
                `Attempting to call createLeadService for correlationId: ${correlationId}`
            );
            const result = await this.service.createLeadService(
                correlationId,
                user,
                company,
                email,
                name,
                phone,
                comments,
                location,
                owner,
                status,
                title
            );
            logger.info(
                `Call to createLeadService service ended for correlationId: ${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have enough privileges for the action",
                    true
                );
            }
            if (result.assignedOwnerDoesNotHaveSufficientAccess) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Assigned owner does not have enough privileges to own a lead",
                    true
                );
            }
            if (result.assignedOwnerBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Assigned owner belongs to a different organisation",
                    true
                );
            }
            if (result.assignedOwnerNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned owner does not exist",
                    true
                );
            }
            if (result.phoneNumberNotValid) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Phone number not valid ${JSON.stringify(phone)}`,
                    true
                );
            }
            logger.info(
                `Lead created successfully lead: ${result.lead?.toJSON()} for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.lead,
                        "Lead created successfully"
                    )
                );
        }
    };
    MoveToContact = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `MoveToContact request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the MoveToContact request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZLeadId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for MoveToContact request params, error: ${JSON.stringify(
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
            const { leadId } = validationResult.data;
            logger.info(
                `Validation successfull for MoveToContact request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call moveToContactService for correlationId: ${correlationId}`
            );
            const result = await this.service.moveToContactService(
                correlationId,
                user,
                leadId
            );
            logger.info(
                `Call to moveToContactService ended for correlationId:${correlationId}`
            );
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to move the lead to contact for unknown reason",
                    true
                );
            }
            if (result.leadBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Lead belong to a different organisation, cannot perform action",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User is not the owner of the lead, action denied",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Lead does not exist",
                    true
                );
            }
            logger.info(
                `Lead moved to contacts successfully correlaionId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        {},
                        "Lead moved to contact successfully"
                    )
                );
        }
    };
    GetAllLeads = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetAllLeads request recieved for correlationId: ${correlationId}`
        );
        if (user) {
            logger.info(
                `Attempting to call getAllLeadsForCurrentOrgService correlationId:${correlationId}`
            );
            // TODO: Pagination and filter quries
            const result =
                await this.service.getAllLeadForCurrentOrganisationService(
                    correlationId,
                    user
                );
            logger.info(
                `Call to getAllLeadsForCurrentOrgService ended successfully correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.leads,
                        "Successfully retrieved all the leads associated with the current organisation"
                    )
                );
        }
    };
    GetOneLead = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetOneLead request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetOneLead request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZLeadId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneLead request params, error: ${JSON.stringify(
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
            const { leadId } = validationResult.data;
            logger.info(
                `Validation successfull for GetOneLead request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call getOneLeadService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneLeadService(
                correlationId,
                user,
                leadId
            );
            logger.info(
                `Call to getOneLeadService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Lead not found",
                    true
                );
            }
            if (result.leadBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Lead belongs to a different org, access denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(StatusCodes.OK, result.lead, "Lead found")
                );
        }
    };
    ChangeStatus = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `ChangeStatus request recieved for correlationId: ${correlationId}`
        );
        const payload = {
            leadId: req.params.leadId,
            status: req.body.status,
        };
        logger.info(
            `Validating the ChangeStatus request payload using zod schema, payload: ${payload} correlationId: ${correlationId}`
        );
        const validationResult = ZChangeStatusInputSchema.safeParse(payload);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed of ChangeStatus  request payload, error: ${JSON.stringify(
                    validationResult.error.errors
                )} correlationId:${correlationId}`
            );
            throw new ApiError(
                StatusCodes.BAD_GATEWAY,
                "Invalid input data",
                true,
                validationResult.error.errors
            );
        }
        if (user) {
            const { leadId, status } = validationResult.data;
            logger.info(
                `Validation successfull for ChangeStatus request payload for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call changeStatusService for ChangeOwner request payload for correlationId:${correlationId}`
            );
            const result = await this.service.changeStatusService(
                correlationId,
                user,
                leadId,
                status
            );
            logger.info(
                `Call to changeStatusService for ChangeStatus request payload for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Lead not found",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Useer is not the owner of the lead, action denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.updatedLead,
                        "Successfully updated the status"
                    )
                );
        }
    };
    UpdateLead = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `UpdateLead request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the UpdateLead request payload using zod schema, payload: ${req.body} correlationId: ${correlationId}`
        );
        const validationResult = ZUpdateLeadInputSchema.safeParse({
            ...req.body,
            ...req.params,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for UpdateLead request payload, error: ${JSON.stringify(
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
                leadId,
                comments,
                company,
                email,
                location,
                name,
                owner,
                phone,
                status,
                title,
            } = validationResult.data;
            logger.info(
                `Validation successfull for UpdateLead request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call updateLeadService for correlationId: ${correlationId}`
            );
            const result = await this.service.updateLeadService(
                correlationId,
                user,
                leadId,
                comments,
                company,
                email,
                location,
                name,
                owner,
                phone,
                status,
                title
            );
            logger.info(
                `Call to updateLeadService service ended for correlationId: ${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Lead not found",
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
            if (result.assignedOwnerDoesNotHaveSufficientAccess) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Assigned owner does not have enough privileges to own a lead",
                    true
                );
            }
            if (result.assignedOwnerBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Assigned owner belongs to a different organisation",
                    true
                );
            }
            if (result.assignedOwnerNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned owner does not exist",
                    true
                );
            }
            if (result.phoneNumberNotValid) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Phone number not valid ${JSON.stringify(phone)}`,
                    true
                );
            }
            logger.info(
                `Lead updated successfully lead: ${result.lead?.toJSON()} for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.lead,
                        "Lead updated successfully"
                    )
                );
        }
    };
    DeleteLead = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `DeleteLead request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the DeleteLead request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZLeadId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for DeleteLead request params, error: ${JSON.stringify(
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
            const { leadId } = validationResult.data;
            logger.info(
                `Validation successfull for DeleteLead request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call deleteLeadService for correlationId: ${correlationId}`
            );
            const result = await this.service.deleteOneLeadService(
                correlationId,
                user,
                leadId
            );
            logger.info(
                `Call to deleteLeadService ended for correlationId:${correlationId}`
            );
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete the lead for unknown reason",
                    true
                );
            }
            if (result.leadBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Lead belong to a different organisation, cannot perform action",
                    true
                );
            }
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User is does not have ADMIN role, action denied",
                    true
                );
            }
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Lead does not exist",
                    true
                );
            }
            logger.info(
                `Lead deleted successfully correlaionId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.lead,
                        "Lead delete successfully"
                    )
                );
        }
    };
}
