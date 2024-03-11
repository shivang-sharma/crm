import { IContacts, IUsers } from "@/database";
import { ROLE } from "@/database/enums";
import {
    FindAccountById,
    RemoveContactFromDealsByContactId,
} from "@/database/queries";
import { logger } from "@/utils/logger";
import phone from "phone";
import {
    CreateNewContact,
    DeleteOneContactById,
    FindContactById,
    FindContactByIdAndUpdate,
    FindManyContactsBy,
} from "@/database/queries/ContactQueries";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "@/utils/error/ApiError";
import mongoose from "mongoose";

export class ContactsService {
    async createContactService(
        correlationId: string,
        currentUser: IUsers,
        email: string,
        name: string,
        phoneNumber: { country?: string; number: string },
        type: string,
        account: string | undefined,
        priority: string | undefined,
        status: string | undefined,
        title: string | undefined
    ) {
        try {
            const response: CreateContactServiceResult = {
                phoneNumberNotValid: false,
                accountBelongToDifferentOrg: false,
                accountNotFound: false,
                notAuthorized: false,
                contact: null,
            };
            // If user has READ_ONLY role reject the request
            if (currentUser.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Contact creation failed because user has READ_ONLY roles, User: ${currentUser.toJSON()} correlationId:${correlationId}`
                );
                return response;
            }
            // check is the provided account is valid
            if (account) {
                const accountObj = await FindAccountById(account);
                if (!accountObj) {
                    // reject account does not exist
                    response.accountNotFound = true;
                    logger.warn(
                        `Assigned account to new contact does not exist, accountId:${account} for correlationId:${correlationId}`
                    );
                    return response;
                }
                if (accountObj.organisation !== currentUser.organisation) {
                    // reject account does not belong to the same org
                    response.accountBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned account belong to a different organisation accountId:${account}, accountOrganisation:${accountObj.organisation}, userOrg:${currentUser.organisation} correlationId:${correlationId}`
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
                const newContactData: Partial<IContacts> = Object.fromEntries(
                    Object.entries({
                        email,
                        name,
                        type,
                        account,
                        priority,
                        status,
                        title,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    }).filter(([key, value]) => value !== undefined)
                );
                newContactData.phone = {
                    countryCode: phoneData.countryCode,
                    countryIso3: phoneData.countryIso3,
                    number: phoneData.phoneNumber,
                };
                newContactData.organisation = currentUser.organisation;
                const newContact = await CreateNewContact(newContactData);
                logger.info(
                    `Contact created ${newContact.toJSON()} correlationId:${correlationId}`
                );
                response.contact = newContact;
                return response;
            }
            // reject phone number not valid
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
    async getAllContactsForCurrentOrgService(
        correlationId: string,
        currentUser: IUsers,
        limit: number,
        page: number,
        account: string | undefined,
        name: string | undefined,
        priority: string | undefined,
        status: string | undefined,
        type: string | undefined
    ) {
        try {
            const response: GetAllContactsForCurrentOrganisationServiceResult =
                {
                    contacts: [],
                };
            const contacts = await FindManyContactsBy(
                currentUser.organisation,
                limit,
                page,
                account,
                name,
                priority,
                status,
                type
            );
            logger.info(
                `Retrieved the contacts associated with organisationId:${currentUser.organisation} correlationId:${correlationId}`
            );
            response.contacts = contacts;
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
    async getOneContactService(
        correlationId: string,
        currentUser: IUsers,
        contactId: string
    ) {
        try {
            const response: GetOneContactServiceResult = {
                contactBelongsToDifferentOrganisation: false,
                notFound: false,
                contact: null,
            };
            const contact = await FindContactById(contactId);
            if (!contact) {
                response.notFound = true;
                logger.warn(
                    `Contact not found contactId:${contactId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the contact belong to different org reject the request
            if (contact.organisation !== currentUser.organisation) {
                response.contactBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Contact belongs to a different organisation access denied for contactId:${contactId} contactOrg:${contact.organisation} userOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Successfully retrieved contact for contactId:${contactId} correlationId:${correlationId}`
            );
            response.contact = contact;
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
    async updateContactService(
        correlationId: string,
        currentUser: IUsers,
        contactId: string,
        account: string | undefined,
        email: string | undefined,
        name: string | undefined,
        phoneNumber: { country?: string; number: string } | undefined,
        priority: string | undefined,
        status: string | undefined,
        title: string | undefined,
        type: string | undefined
    ) {
        try {
            const response: CreateContactServiceResult & { notFound: boolean } =
                {
                    accountBelongToDifferentOrg: false,
                    accountNotFound: false,
                    contact: null,
                    notAuthorized: false,
                    notFound: false,
                    phoneNumberNotValid: false,
                };
            // If user has READ_ONLY role reject the request
            if (currentUser.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Contact updation failed because user has READ_ONLY roles, User: ${currentUser.toJSON()} correlationId:${correlationId}`
                );
                return response;
            }
            const contact = await FindContactById(contactId);
            if (!contact) {
                response.notFound = true;
                logger.warn(
                    `Contact does not exist contactId:${contactId} correlationId:${correlationId}`
                );
                return response;
            }
            // check is the provided account is valid
            if (account) {
                const accountObj = await FindAccountById(account);
                if (!accountObj) {
                    // reject account does not exist
                    response.accountNotFound = true;
                    logger.warn(
                        `Assigned account does not exist, accountId:${account} for correlationId:${correlationId}`
                    );
                    return response;
                }
                if (accountObj.organisation !== currentUser.organisation) {
                    // reject account does not belong to the same org
                    response.accountBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned account belong to a different organisation accountId:${account}, accountOrganisation:${accountObj.organisation}, userOrg:${currentUser.organisation} correlationId:${correlationId}`
                    );
                    return response;
                }
            }
            const contactUpdateData: Partial<IContacts> = Object.fromEntries(
                Object.entries({
                    account,
                    email,
                    name,
                    priority,
                    status,
                    title,
                    type,
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
                contactUpdateData.phone = {
                    countryCode: phoneData.countryCode,
                    countryIso3: phoneData.countryIso3,
                    number: phoneData.phoneNumber,
                };
            }
            const updatedContact = await FindContactByIdAndUpdate(
                contactId,
                contactUpdateData
            );
            if (!updatedContact) {
                response.notFound = true;
                logger.warn(
                    `Contact does not exist contactId: ${contactId} correlationId:${correlationId}`
                );
                return response;
            }
            response.contact = updatedContact;
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
    async deleteOneContactService(
        correlationId: string,
        currentUser: IUsers,
        contactId: string
    ) {
        const session = await mongoose.startSession();
        try {
            const response: DeleteOneContactServiceResult = {
                contactBelongsToDifferentOrganisation: false,
                noOfDealsModified: 0,
                notFound: false,
                contact: null,
                failed: false,
                notAuthorized: false,
            };
            if (currentUser.role !== ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User is does not have sufficient privileges to perform the action, action denied for contactId:${contactId} userRole:${currentUser.role} correlationId:${correlationId}`
                );
                return response;
            }
            const contact = await FindContactById(contactId);
            if (!contact) {
                response.notFound = true;
                logger.warn(
                    `Contact not found contactId:${contactId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the contact belong to different org reject the request
            if (contact.organisation !== currentUser.organisation) {
                response.contactBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Contact belongs to a different organisation access denied for contactId:${contactId} contactOrg:${contact.organisation} userOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            session.startTransaction();
            // Remove the contact from the any of the deals it is associated with
            const removedContactFromDealsResult =
                await RemoveContactFromDealsByContactId(contactId);
            response.noOfDealsModified =
                removedContactFromDealsResult.modifiedCount;
            logger.info(
                `Removed contact from all the deals it was associated with removeResult:${JSON.stringify(
                    removedContactFromDealsResult
                )} contactId${contactId} for correlationId:${correlationId}`
            );
            const deletedResult = await DeleteOneContactById(contactId);
            if (
                deletedResult.deletedCount === 0 ||
                !deletedResult.acknowledged
            ) {
                logger.warn(
                    `Couldn't delete the contact for unknown reason deleteResult:${deletedResult} contactId:${contactId}, for correlationId:${correlationId}`
                );
                response.failed = true;
                await session.abortTransaction();
                await session.endSession();
                logger.info(
                    `Delete contact transaction aborted for correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Contact deleted successfully contactId:${contactId}, correlationId:${correlationId}`
            );
            response.contact = contact;
            await session.commitTransaction();
            await session.endSession();
            logger.info(
                `Delete contact transaction commited successfully for correlationId:${correlationId}`
            );
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.info(
                `Delete contact transaction aborted for correlationId:${correlationId}`
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
}
export type CreateContactServiceResult = {
    accountBelongToDifferentOrg: boolean;
    phoneNumberNotValid: boolean;
    accountNotFound: boolean;
    notAuthorized: boolean;
    contact: IContacts | null;
};
export type GetAllContactsForCurrentOrganisationServiceResult = {
    contacts: IContacts[];
};
export type GetOneContactServiceResult = {
    notFound: boolean;
    contactBelongsToDifferentOrganisation: boolean;
    contact: IContacts | null;
};

export type DeleteOneContactServiceResult = {
    contactBelongsToDifferentOrganisation: boolean;
    noOfDealsModified: number;
    notFound: boolean;
    contact: IContacts | null;
    failed: boolean;
    notAuthorized: boolean;
};
