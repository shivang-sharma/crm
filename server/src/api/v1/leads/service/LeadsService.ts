import { IContacts, ILeads, IUsers } from "@/database";
import { CONTACT_TYPE, LEAD_STATUS, ROLE } from "@/database/enums";
import { FindOneUserById } from "@/database/queries";
import { CreateNewContact } from "@/database/queries/ContactQueries";
import {
    CreateNewLead,
    DeleteOneLeadById,
    FindLeadById,
    FindLeadByIdAndUpdate,
    FindManyLeadsBy,
} from "@/database/queries/LeadQueries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import phone from "phone";

export class LeadsService {
    async createLeadService(
        correlationId: string,
        currentUser: IUsers,
        company: string,
        email: string,
        name: string,
        phoneNumber: { country?: string; number: string },
        comments: string | undefined,
        location: string | undefined,
        owner: string | undefined,
        status: string | undefined,
        title: string | undefined
    ) {
        try {
            const response: CreateLeadServiceResult = {
                notAuthorized: false,
                phoneNumberNotValid: false,
                assignedOwnerBelongToDifferentOrg: false,
                assignedOwnerDoesNotHaveSufficientAccess: false,
                assignedOwnerNotFound: false,
                lead: null,
            };
            // If user has READ_ONLY role reject the request
            if (currentUser.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Lead creation failed because user has READ_ONLY roles, User: ${currentUser.toJSON()} correlationId:${correlationId}`
                );
                return response;
            }
            // Check if the provided owner has adequate access or not
            if (owner) {
                const ownerObj = await FindOneUserById(owner);
                if (!ownerObj) {
                    // reject owner not found
                    response.assignedOwnerNotFound = true;
                    logger.warn(
                        `Assigned owner to new lead does not exist, ownerId:${owner} for correlationId:${correlationId}`
                    );
                    return response;
                }
                if (ownerObj.role === ROLE.READ_ONLY) {
                    // reject owner has READ_ONLY access
                    response.assignedOwnerDoesNotHaveSufficientAccess = true;
                    logger.warn(
                        `Assigned owner to new lead does not sufficient access, assignedOwnerId:${owner}, assignedOwnerRole:${ownerObj.role}, correlationId:${correlationId} `
                    );
                    return response;
                }
                if (!ownerObj.organisation.equals(currentUser.organisation)) {
                    // reject owner does not belong to the same org
                    response.assignedOwnerBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned owner belong to a different organisation assignedOwnerId:${owner}, assignedOwnerOrganisation:${ownerObj.organisation}, userOrg:${currentUser.organisation} correlationId:${correlationId}`
                    );
                    return response;
                }
            }
            // Prepare phone number for storing in db
            let phoneData;
            if (phoneNumber.country) {
                phoneData = phone(phoneNumber.number, {
                    country: phoneNumber.country,
                });
            } else {
                phoneData = phone(phoneNumber.number);
            }
            if (phoneData.isValid) {
                const newLeadData: Partial<ILeads> = Object.fromEntries(
                    Object.entries({
                        company,
                        email,
                        name,
                        comments,
                        location,
                        owner,
                        status,
                        title,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    }).filter(([key, value]) => value !== undefined)
                );
                newLeadData.phone = {
                    countryCode: phoneData.countryCode,
                    countryIso3: phoneData.countryIso3,
                    number: phoneData.phoneNumber,
                };
                newLeadData.organisation = currentUser.organisation;
                const newLead = await CreateNewLead(newLeadData);
                logger.info(
                    `Lead created ${newLead.toJSON()} correlationId:${correlationId}`
                );
                response.lead = newLead;
                return response;
            }
            response.phoneNumberNotValid = true;
            logger.warn(
                `Phone data not valid phoneNumber: ${phoneNumber}, validationData: ${phoneData} for correlationId:${correlationId}`
            );
            return response;
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
    async moveToContactService(
        correlationId: string,
        currentUser: IUsers,
        leadId: string
    ) {
        // Starting transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: MoveToContactServiceResult = {
                notFound: false,
                notAuthorized: false,
                leadBelongToDifferentOrg: false,
                failed: false,
            };
            const lead = await FindLeadById(leadId);
            if (!lead) {
                response.notFound = true;
                logger.warn(
                    `Lead not found with id:${leadId} for correlationId:${correlationId}`
                );
                return response;
            }
            if (lead.organisation.equals(currentUser.organisation)) {
                response.leadBelongToDifferentOrg = true;
                logger.warn(
                    `Lead belong to a different organisation, leadOrgId:${lead.organisation} userOrg:${currentUser.organisation} for correlationId:${correlationId}`
                );
                return response;
            }
            // If the user is not the owner of the lead then reject the request
            if (!lead.owner.equals(currentUser.id)) {
                response.notAuthorized = true;
                logger.warn(
                    `User is not the owner of the Lead, leadId:${leadId}, ownerId:${lead.owner}, userId:${currentUser.id} for correlationId:${correlationId}`
                );
                return response;
            }
            const contactData: Partial<IContacts> = {
                name: lead.name,
                title: lead.title,
                email: lead.email,
                phone: lead.phone,
                type: CONTACT_TYPE.QUALIFIED_LEAD,
                organisation: lead.organisation,
            };
            const contact = await CreateNewContact(contactData);
            if (!contact) {
                logger.warn(
                    `Failed to created contact for some reason contactData:${JSON.stringify(
                        contactData
                    )}, leadId:${leadId} for correlationId:${correlationId}`
                );
                await session.abortTransaction();
                await session.endSession();
                response.failed = true;
                return response;
            }
            logger.info(
                `Contact created successfully, contact:${contact.toJSON()} for lead:${lead.toJSON()} correlationId:${correlationId}`
            );
            // Delete the lead
            const deletedResult = await DeleteOneLeadById(lead.id);
            if (
                deletedResult.deletedCount === 0 ||
                !deletedResult.acknowledged
            ) {
                logger.warn(
                    `Couldn't delete the Lead after contact creation, deleteResult:${deletedResult} leadId:${leadId}, for correlationId:${correlationId}`
                );
                await session.abortTransaction();
                await session.endSession();
                response.failed = true;
                return response;
            }
            logger.info(
                `Lead deleted successfully leadId:${leadId}, correlationId:${correlationId}`
            );
            await session.commitTransaction();
            await session.endSession();
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.debug(
                `Move to contact transaction aborted corrleationId: ${correlationId}`
            );
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
    async getAllLeadForCurrentOrganisationService(
        correlationId: string,
        currentUser: IUsers,
        limit: number,
        page: number,
        name: string | undefined,
        owner: string | undefined,
        status: string | undefined
    ) {
        try {
            const response: GetAllLeadForCurrentOrganisationServiceResult = {
                leads: [],
            };
            const leads = await FindManyLeadsBy(
                currentUser.organisation,
                limit,
                page,
                name,
                owner,
                status
            );
            logger.info(
                `Retrieved the leads associated with organisationId:${currentUser.organisation} correlationId:${correlationId}`
            );
            response.leads = leads;
            return response;
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
    async getOneLeadService(
        correlationId: string,
        currentUser: IUsers,
        leadId: string
    ) {
        try {
            const response: GetOneLeadServiceResult = {
                leadBelongsToDifferentOrganisation: false,
                notFound: false,
                lead: null,
            };
            const lead = await FindLeadById(leadId);
            if (!lead) {
                response.notFound = true;
                logger.warn(
                    `Lead not found leadId:${leadId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the lead belong to different org reject the request
            if (!lead.organisation.equals(currentUser.organisation)) {
                response.leadBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Lead belongs to a different organisation access denied for leadId:${leadId} leadOrg:${lead.organisation} userOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Successfully retrieved lead for leadId:${leadId} correlationId:${correlationId}`
            );
            response.lead = lead;
            return response;
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
    async changeStatusService(
        correlationId: string,
        currentUser: IUsers,
        leadId: string,
        status: string
    ) {
        try {
            const response: ChangeStatusServiceResult = {
                notAuthorized: false,
                notFound: false,
                updatedLead: null,
            };
            const lead = await FindLeadById(leadId);
            if (!lead) {
                response.notFound = true;
                logger.warn(
                    `Lead not found leadId:${leadId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if user is not the owner of the lead then reject
            if (!lead.owner.equals(currentUser.id)) {
                response.notAuthorized = true;
                logger.warn(
                    `User is not the owner of the lead, action denied, leadOwner: ${lead.owner} userId:${currentUser.id} correlationId;${correlationId}`
                );
                return response;
            }
            const oldStatus = lead.status;
            lead.status = status as LEAD_STATUS;
            lead.isNew = false;
            const ulead = await lead.save();
            logger.info(
                `Status of the lead is updated FROM:${oldStatus} =>  ${ulead.status} for leadId:${leadId} by userId:${currentUser.id} correaltionId:${correlationId}`
            );
            response.updatedLead = ulead;
            return response;
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
    async updateLeadService(
        correlationId: string,
        currentUser: IUsers,
        leadId: string,
        comments: string | undefined,
        company: string | undefined,
        email: string | undefined,
        location: string | undefined,
        name: string | undefined,
        owner: string | undefined,
        phoneNumber: { country?: string; number: string } | undefined,
        status: string | undefined,
        title: string | undefined
    ) {
        try {
            const response: CreateLeadServiceResult & { notFound: boolean } = {
                phoneNumberNotValid: false,
                notAuthorized: false,
                notFound: false,
                assignedOwnerDoesNotHaveSufficientAccess: false,
                assignedOwnerNotFound: false,
                assignedOwnerBelongToDifferentOrg: false,
                lead: null,
            };
            const lead = await FindLeadById(leadId);
            if (!lead) {
                response.notFound = true;
                logger.warn(
                    `Lead does not exist leadId: ${leadId} correlationId:${correlationId}`
                );
                return response;
            }
            // If user is not the owner of the lead then reject the request
            if (!lead.owner.equals(currentUser.id)) {
                response.notAuthorized = true;
                logger.warn(
                    `Lead updation failed because user is not the owner of the lead, UserId: ${currentUser.id}, leadOwner:${lead.owner} correlationId:${correlationId}`
                );
                return response;
            }
            if (owner) {
                const ownerObj = await FindOneUserById(owner);
                if (!ownerObj) {
                    // reject owner not found
                    response.assignedOwnerNotFound = true;
                    logger.warn(
                        `Assigned owner to lead does not exist, ownerId:${owner} for correlationId:${correlationId}`
                    );
                    return response;
                }
                if (ownerObj.role === ROLE.READ_ONLY) {
                    // reject owner has READ_ONLY access
                    response.assignedOwnerDoesNotHaveSufficientAccess = true;
                    logger.warn(
                        `Assigned owner to lead does not sufficient access, assignedOwnerId:${owner}, assignedOwnerRole:${ownerObj.role}, correlationId:${correlationId} `
                    );
                    return response;
                }
                if (!ownerObj.organisation.equals(currentUser.organisation)) {
                    // reject owner does not belong to the same org
                    response.assignedOwnerBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned owner belong to a different organisation assignedOwnerId:${owner}, assignedOwnerOrganisation:${ownerObj.organisation}, userOrg:${currentUser.organisation} correlationId:${correlationId}`
                    );
                    return response;
                }
            }
            const leadUpdateData: Partial<ILeads> = Object.fromEntries(
                Object.entries({
                    comments,
                    company,
                    email,
                    location,
                    name,
                    owner,
                    status,
                    title,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );
            let phoneData;
            if (phoneNumber) {
                if (phoneNumber.country) {
                    phoneData = phone(phoneNumber.number, {
                        country: phoneNumber.country,
                    });
                } else {
                    phoneData = phone(phoneNumber.number);
                }
                if (!phoneData.isValid) {
                    response.phoneNumberNotValid = true;
                    logger.warn(
                        `Phone data not valid phoneNumber: ${phoneNumber}, validationData: ${phoneData} for correlationId:${correlationId}`
                    );
                    return response;
                }
                leadUpdateData.phone = {
                    countryCode: phoneData.countryCode,
                    countryIso3: phoneData.countryIso3,
                    number: phoneData.phoneNumber,
                };
            }
            const updatedLead = await FindLeadByIdAndUpdate(
                leadId,
                leadUpdateData
            );
            if (!updatedLead) {
                response.notFound = true;
                logger.warn(
                    `Lead does not exist leadId: ${leadId} correlationId:${correlationId}`
                );
                return response;
            }
            response.lead = updatedLead;
            return response;
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
    async deleteOneLeadService(
        correlationId: string,
        currentUser: IUsers,
        leadId: string
    ) {
        try {
            const response: DeleteOneLeadServiceResult = {
                leadBelongsToDifferentOrganisation: false,
                notFound: false,
                lead: null,
                failed: false,
                notAuthorized: false,
            };
            if (currentUser.role !== ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User is does not have sufficient privileges to perform the action, action denied for leadId:${leadId} userRole:${currentUser.role} correlationId:${correlationId}`
                );
                return response;
            }
            const lead = await FindLeadById(leadId);
            if (!lead) {
                response.notFound = true;
                logger.warn(
                    `Lead not found leadId:${leadId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the lead belong to different org reject the request
            if (!lead.organisation.equals(currentUser.organisation)) {
                response.leadBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Lead belongs to a different organisation access denied for leadId:${leadId} leadOrg:${lead.organisation} userOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            const deletedResult = await DeleteOneLeadById(leadId);
            if (
                deletedResult.deletedCount === 0 ||
                !deletedResult.acknowledged
            ) {
                logger.warn(
                    `Couldn't delete the Lead for unknown reason deleteResult:${deletedResult} leadId:${leadId}, for correlationId:${correlationId}`
                );
                response.failed = true;
                return response;
            }
            logger.info(
                `Lead deleted successfully leadId:${leadId}, correlationId:${correlationId}`
            );
            response.lead = lead;
            return response;
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
}

export type CreateLeadServiceResult = {
    notAuthorized: boolean;
    phoneNumberNotValid: boolean;
    assignedOwnerDoesNotHaveSufficientAccess: boolean;
    assignedOwnerNotFound: boolean;
    assignedOwnerBelongToDifferentOrg: boolean;
    lead: ILeads | null;
};
export type MoveToContactServiceResult = {
    notFound: boolean;
    notAuthorized: boolean;
    leadBelongToDifferentOrg: boolean;
    failed: boolean;
};
export type GetAllLeadForCurrentOrganisationServiceResult = {
    leads: ILeads[];
};
export type GetOneLeadServiceResult = {
    notFound: boolean;
    leadBelongsToDifferentOrganisation: boolean;
    lead: ILeads | null;
};
export type ChangeStatusServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    updatedLead: ILeads | null;
};
export type DeleteOneLeadServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    leadBelongsToDifferentOrganisation: boolean;
    failed: boolean;
    lead: ILeads | null;
};
