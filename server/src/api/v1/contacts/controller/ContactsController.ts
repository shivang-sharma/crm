import type { Response } from "express";
import { CustomRequest } from "@/utils/CustomRequest";
import { logger } from "@/utils/logger";
import { ContactsService } from "../service/ContactsService";
import { ZCreateContactInputSchema } from "../zschema/ZCreateContactInputSchema";
import { ApiError } from "@/utils/error/ApiError";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "@/utils/ApiResponse";
import { ZContactId } from "../zschema/ZContactId";
import { ZUpdateContactInputSchema } from "../zschema/ZUpdateContactInputSchema";

export class ContactsController {
    private service: ContactsService;
    constructor(service: ContactsService) {
        this.service = service;
    }
    CreateContact = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `CreateContact request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the CreateContact request payload using zod schema, payload:${req.body}, correlationId:${correlationId}`
        );
        const validationResult = ZCreateContactInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for CreateContact request payload, errors: ${JSON.stringify(
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
                `Validation successfull for CreateContact request payload for correlationId: ${correlationId}`
            );
            const {
                email,
                name,
                phone,
                type,
                account,
                priority,
                status,
                title,
            } = validationResult.data;
            logger.info(
                `Attempting to call createContactService for correlationId: ${correlationId}`
            );
            const result = await this.service.createContactService(
                correlationId,
                user,
                email,
                name,
                phone,
                type,
                account,
                priority,
                status,
                title
            );
            logger.info(
                `Call to createContactService service ended for correlationId: ${correlationId}`
            );
            if (result.notAuthorized) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "User does not have enough privileges for the action",
                    true
                );
            }
            if (result.accountNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned account does not exist",
                    true
                );
            }
            if (result.accountBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Assigned account belongs to a different organisation",
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
                `Contact created successfully, contact: ${result.contact?.toJSON()} for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.CREATED)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.contact,
                        "Contact created successfully"
                    )
                );
        }
    };
    GetAllContacts = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetAllContacts request recieved for correlationId: ${correlationId}`
        );
        if (user) {
            logger.info(
                `Attempting to call getAllContactsForCurrentOrgService correlationId:${correlationId}`
            );
            // TODO: Pagination and filter quries
            const result =
                await this.service.getAllContactsForCurrentOrgService(
                    correlationId,
                    user
                );
            logger.info(
                `Call to getAllContactsForCurrentOrgService ended successfully correlationId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.contacts,
                        "Successfully retrieved all the contacts associated with the current organisation"
                    )
                );
        }
    };
    GetOneContact = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `GetOneContact request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the GetOneContact request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZContactId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for GetOneContact request params, error: ${JSON.stringify(
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
            const { contactId } = validationResult.data;
            logger.info(
                `Validation successfull for GetOneContact request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call getOneContactService for correlationId: ${correlationId}`
            );
            const result = await this.service.getOneContactService(
                correlationId,
                user,
                contactId
            );
            logger.info(
                `Call to getOneContactService ended for correlationId:${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Contact not found",
                    true
                );
            }
            if (result.contactBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Contact belongs to a different org, access denied",
                    true
                );
            }
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.contact,
                        "Contact found"
                    )
                );
        }
    };
    UpdateContact = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `UpdateContact request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the UpdateContact request payload using zod schema, payload: ${req.body} correlationId: ${correlationId}`
        );
        const validationResult = ZUpdateContactInputSchema.safeParse({
            ...req.body,
            ...req.params,
        });
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for UpdateContact request payload, error: ${JSON.stringify(
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
                contactId,
                account,
                email,
                name,
                phone,
                priority,
                status,
                title,
                type,
            } = validationResult.data;
            logger.info(
                `Validation successfull for UpdateContact request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call updateContactService for correlationId: ${correlationId}`
            );
            const result = await this.service.updateContactService(
                correlationId,
                user,
                contactId,
                account,
                email,
                name,
                phone,
                priority,
                status,
                title,
                type
            );
            logger.info(
                `Call to updateContactService service ended for correlationId: ${correlationId}`
            );
            if (result.notFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Contact not found",
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
            if (result.accountNotFound) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Assigned account does not exist",
                    true
                );
            }
            if (result.accountBelongToDifferentOrg) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Assigned account belongs to a different organisation",
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
                `Contact updated successfully contact: ${result.contact?.toJSON()} for correlationId: ${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.contact,
                        "Contact updated successfully"
                    )
                );
        }
    };
    DeleteContact = async (req: CustomRequest, res: Response) => {
        const correlationId = res.getHeader("X-CorrelationId") as string;
        const user = req.user;
        logger.info(
            `DeleteContact request recieved for correlationId: ${correlationId}`
        );
        logger.info(
            `Validating the DeleteContact request payload using zod schema, params: ${req.params} correlationId: ${correlationId}`
        );
        const validationResult = ZContactId.safeParse(req.params);
        if (!validationResult.success) {
            logger.warn(
                `Validation failed for DeleteContact request params, error: ${JSON.stringify(
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
            const { contactId } = validationResult.data;
            logger.info(
                `Validation successfull for DeleteContact request for correlationId:${correlationId}`
            );
            logger.info(
                `Attempting to call deleteContactService for correlationId: ${correlationId}`
            );
            const result = await this.service.deleteOneContactService(
                correlationId,
                user,
                contactId
            );
            logger.info(
                `Call to deleteContactService ended for correlationId:${correlationId}`
            );
            if (result.failed) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete the contact for unknown reason",
                    true
                );
            }
            if (result.contactBelongsToDifferentOrganisation) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "Contact belong to a different organisation, cannot perform action",
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
                    "Contact does not exist",
                    true
                );
            }
            logger.info(
                `Contact deleted successfully correlaionId:${correlationId}`
            );
            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        result.contact,
                        "Contact delete successfully"
                    )
                );
        }
    };
}
