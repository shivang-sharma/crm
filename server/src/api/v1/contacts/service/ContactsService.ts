import { IContacts, IUsers } from "@/database";
import { ROLE } from "@/database/enums";
import { FindAccountById } from "@/database/queries";
import { logger } from "@/utils/logger";
import phone from "phone";
import {
    CreateNewContact,
    DeleteOneContactById,
    FindContactById,
    FindContactByIdAndUpdate,
    FindManyContactsByOrganisationId,
} from "@/database/queries/ContactQueries";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "@/utils/error/ApiError";

export class ContactsService {
    async createContactService(
        correlationId: string,
        user: IUsers,
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
            if (user.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Contact creation failed because user has READ_ONLY roles, User: ${user.toJSON()} correlationId:${correlationId}`
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
                if (accountObj.organisation !== user.organisation) {
                    // reject account does not belong to the same org
                    response.accountBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned account belong to a different organisation accountId:${account}, accountOrganisation:${accountObj.organisation}, userOrg:${user.organisation} correlationId:${correlationId}`
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
                newContactData.organisation = user.organisation;
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
        user: IUsers
    ) {
        try {
            const response: GetAllContactsForCurrentOrganisationServiceResult =
                {
                    contacts: [],
                };
            const contacts = await FindManyContactsByOrganisationId(
                user.organisation
            );
            logger.info(
                `Retrieved the contacts associated with organisationId:${user.organisation} correlationId:${correlationId}`
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
        user: IUsers,
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
            if (contact.organisation !== user.organisation) {
                response.contactBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Contact belongs to a different organisation access denied for contactId:${contactId} contactOrg:${contact.organisation} userOrg:${user.organisation} correlationId:${correlationId}`
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
        user: IUsers,
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
            if (user.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Contact updation failed because user has READ_ONLY roles, User: ${user.toJSON()} correlationId:${correlationId}`
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
                if (accountObj.organisation !== user.organisation) {
                    // reject account does not belong to the same org
                    response.accountBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned account belong to a different organisation accountId:${account}, accountOrganisation:${accountObj.organisation}, userOrg:${user.organisation} correlationId:${correlationId}`
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
        user: IUsers,
        contactId: string
    ) {
        const response: DeleteOneContactServiceResult = {
            contactBelongsToDifferentOrganisation: false,
            notFound: false,
            contact: null,
            failed: false,
            notAuthorized: false,
        };
        if (user.role !== ROLE.ADMIN) {
            response.notAuthorized = true;
            logger.warn(
                `User is does not have sufficient privileges to perform the action, action denied for contactId:${contactId} userRole:${user.role} correlationId:${correlationId}`
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
        if (contact.organisation !== user.organisation) {
            response.contactBelongsToDifferentOrganisation = true;
            logger.warn(
                `Contact belongs to a different organisation access denied for contactId:${contactId} contactOrg:${contact.organisation} userOrg:${user.organisation} correlationId:${correlationId}`
            );
            return response;
        }
        const deletedResult = await DeleteOneContactById(contactId);
        if (deletedResult.deletedCount === 0 || !deletedResult.acknowledged) {
            logger.warn(
                `Couldn't delete the contact for unknown reason deleteResult:${deletedResult} contactId:${contactId}, for correlationId:${correlationId}`
            );
            response.failed = true;
            return response;
        }
        logger.info(
            `Contact deleted successfully contactId:${contactId}, correlationId:${correlationId}`
        );
        response.contact = contact;
        return response;
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
    notFound: boolean;
    contact: IContacts | null;
    failed: boolean;
    notAuthorized: boolean;
};
