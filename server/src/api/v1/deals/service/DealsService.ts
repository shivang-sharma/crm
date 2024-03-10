import { IDeals, IUsers } from "@/database";
import { ROLE } from "@/database/enums";
import {
    FindAccountById,
    FindOneUserById,
    FindManyDealsByOrganisationId,
} from "@/database/queries";
import { FindContactById } from "@/database/queries/ContactQueries";
import {
    CreateNewDeal,
    DeleteOneDealById,
    FindDealById,
    FindDealByIdAndUpdate,
} from "@/database/queries/DealsQueries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";

export class DealsService {
    async createDealService(
        correlationId: string,
        currentUser: IUsers,
        account: string,
        contacts: string[],
        name: string,
        owner: string,
        value: { amount: number; currency?: string },
        actualValue: { amount: number; currency?: string } | undefined,
        closeProbability: number | undefined,
        closedAt: Date | undefined,
        expectedCloseDate: Date | undefined,
        priority: string | undefined,
        stage: string | undefined
    ) {
        try {
            const response: CreateDealServiceResult = {
                deal: null,
                notAuthorized: false,
                assignedOwnerNotFound: false,
                assignedOwnerBelongToDifferentOrg: false,
                assignedAccountNotFound: false,
                assignedAccountBelongToDifferentOrg: false,
                someContactsNotFound: false,
                someContactsBelongToDifferentOrg: false,
            };
            if (currentUser.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to perform action, action denied userId:${currentUser.id} userRole:${currentUser.role} correlationId:${correlationId}`
                );
                return response;
            }
            // check if the assigned owner exists or not
            const ownerObj = await FindOneUserById(owner);
            if (!ownerObj) {
                response.assignedOwnerNotFound = true;
                logger.warn(
                    `Assigned owner does not exist ownerId:${owner} correlationId:${correlationId}`
                );
                return response;
            }
            // check if the assigned owner belongs to same org or not
            if (ownerObj.organisation !== currentUser.organisation) {
                response.assignedOwnerBelongToDifferentOrg = true;
                logger.warn(
                    `Assigned owner belongs to a different organisation ownerOrg:${ownerObj.organisation} currentUserOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            // check if the assigned account exists or not
            const accountObj = await FindAccountById(account);
            if (!accountObj) {
                response.assignedAccountNotFound = true;
                logger.warn(
                    `Assigned account does not exist accountId:${account} correlationId:${correlationId}`
                );
                return response;
            }
            // check if the assigned owner belongs to same org or not
            if (accountObj.organisation !== currentUser.organisation) {
                response.assignedAccountBelongToDifferentOrg = true;
                logger.warn(
                    `Assigned account belongs to a different organisation accountOrg:${accountObj.organisation} currentUserOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }

            // check if all the assigned contacts exists and belong to same org or not,
            const contactsPromises = contacts.map((contact) =>
                FindContactById(contact)
            );
            const contactsObjects = await Promise.all(contactsPromises);
            for (const contactObj of contactsObjects) {
                if (!contactObj) {
                    response.someContactsNotFound = true;
                    logger.warn(
                        `Assigned contact does not exist correlationId:${correlationId}`
                    );
                    return response;
                }
                if (contactObj.organisation !== currentUser.organisation) {
                    response.someContactsBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned contact belongs to different org correlationId:${correlationId}`
                    );
                    return response;
                }
            }
            const dealData: Partial<IDeals> = Object.fromEntries(
                Object.entries({
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
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );
            dealData.organisation = currentUser.organisation;
            const createdDeal = await CreateNewDeal(dealData);
            response.deal = createdDeal;
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
    async getAllDealsForCurrentOrgService(
        correlationId: string,
        currentUser: IUsers
    ) {
        try {
            const response: GetAllDealsForCurrentOrganisationServiceResult = {
                deals: [],
            };
            const deals = await FindManyDealsByOrganisationId(
                currentUser.organisation
            );
            logger.info(
                `Retrieved the deals associated with organisationId:${currentUser.organisation} correlationId:${correlationId}`
            );
            response.deals = deals;
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
    async getOneDealService(
        correlationId: string,
        currentUser: IUsers,
        dealId: string
    ) {
        try {
            const response: GetOneDealServiceResult = {
                dealBelongsToDifferentOrganisation: false,
                notFound: false,
                deal: null,
            };
            const deal = await FindDealById(dealId);
            if (!deal) {
                response.notFound = true;
                logger.warn(
                    `Deal not found dealId:${dealId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the deal belong to different org reject the request
            if (deal.organisation !== deal.organisation) {
                response.dealBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Deal belongs to a different organisation access denied for dealId:${dealId} dealOrg:${deal.organisation} userOrg:${deal.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Successfully retrieved deal for dealId:${dealId} correlationId:${correlationId}`
            );
            response.deal = deal;
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
    async updateDealService(
        correlationId: string,
        currentUser: IUsers,
        dealId: string,
        actualValue: { amount: number; currency?: string } | undefined,
        closeProbability: number | undefined,
        closedAt: Date | undefined,
        contacts: string[] | undefined,
        expectedCloseDate: Date | undefined,
        name: string | undefined,
        owner: string | undefined,
        priority: string | undefined,
        stage: string | undefined,
        value: { amount: number; currency?: string } | undefined
    ) {
        try {
            const response: UpdateDealServiceResult = {
                dealBelongToDifferentOrg: false,
                assignedOwnerBelongToDifferentOrg: false,
                assignedOwnerNotFound: false,
                deal: null,
                notAuthorized: false,
                notFound: false,
                someContactsBelongToDifferentOrg: false,
                someContactsNotFound: false,
            };
            if (currentUser.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to perform action, action denied userId:${currentUser.id} userRole:${currentUser.role} correlationId:${correlationId}`
                );
                return response;
            }
            const deal = await FindDealById(dealId);
            if (!deal) {
                response.notAuthorized = true;
                logger.warn(
                    `Deal not found dealId:${dealId} correlationId:${correlationId}`
                );
                return response;
            }
            if (deal.organisation !== currentUser.organisation) {
                response.dealBelongToDifferentOrg = true;
                logger.warn(
                    `Deal belongs to different organisation dealId:${dealId} dealOrg:${deal.organisation} currentUserOrg:${currentUser.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            if (owner) {
                // check if the assigned owner exists or not
                const ownerObj = await FindOneUserById(owner);
                if (!ownerObj) {
                    response.assignedOwnerNotFound = true;
                    logger.warn(
                        `Assigned owner does not exist ownerId:${owner} correlationId:${correlationId}`
                    );
                    return response;
                }
                // check if the assigned owner belongs to same org or not
                if (ownerObj.organisation !== currentUser.organisation) {
                    response.assignedOwnerBelongToDifferentOrg = true;
                    logger.warn(
                        `Assigned owner belongs to a different organisation ownerOrg:${ownerObj.organisation} currentUserOrg:${currentUser.organisation} correlationId:${correlationId}`
                    );
                    return response;
                }
            }
            if (contacts) {
                // check if all the assigned contacts exists and belong to same org or not,
                const contactsPromises = contacts.map((contact) =>
                    FindContactById(contact)
                );
                const contactsObjects = await Promise.all(contactsPromises);
                for (const contactObj of contactsObjects) {
                    if (!contactObj) {
                        response.someContactsNotFound = true;
                        logger.warn(
                            `Assigned contact does not exist correlationId:${correlationId}`
                        );
                        return response;
                    }
                    if (contactObj.organisation !== currentUser.organisation) {
                        response.someContactsBelongToDifferentOrg = true;
                        logger.warn(
                            `Assigned contact belongs to different org correlationId:${correlationId}`
                        );
                        return response;
                    }
                }
            }
            const dealUpdate: Partial<IDeals> = Object.fromEntries(
                Object.entries({
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
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );
            const updatedDeal = await FindDealByIdAndUpdate(dealId, dealUpdate);
            if (!updatedDeal) {
                response.notFound = true;
                logger.warn(
                    `Deal not found dealId:${dealId} correlationId:${correlationId}`
                );
                return response;
            }
            response.deal = updatedDeal;
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
    async deleteOneDealService(
        correlationId: string,
        currentUser: IUsers,
        dealId: string
    ) {
        try {
            const response: DeleteOneDealServiceResult = {
                deal: null,
                dealBelongsToDifferentOrganisation: false,
                failed: false,
                notAuthorized: false,
                notFound: false,
            };
            if (currentUser.role !== ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User is does not have sufficient privileges to perform the action, action denied for contactId:${contactId} userRole:${user.role} correlationId:${correlationId}`
                );
                return response;
            }
            const deal = await FindDealById(dealId);
            if (!deal) {
                response.notFound = true;
                logger.warn(
                    `Deal not found dealId:${dealId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the deal belong to different org reject the request
            if (deal.organisation !== currentUser.organisation) {
                response.dealBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Deal belongs to a different organisation access denied for contactId:${contactId} contactOrg:${contact.organisation} userOrg:${user.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            const deletedResult = await DeleteOneDealById(dealId);
            if (
                deletedResult.deletedCount === 0 ||
                !deletedResult.acknowledged
            ) {
                logger.warn(
                    `Couldn't delete the deal for unknown reason deleteResult:${deletedResult} contactId:${contactId}, for correlationId:${correlationId}`
                );
                response.failed = true;
                return response;
            }
            logger.info(
                `Deal deleted successfully dealId:${dealId}, correlationId:${correlationId}`
            );
            response.deal = deal;
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

type CreateDealServiceResult = {
    notAuthorized: boolean;
    assignedOwnerNotFound: boolean;
    assignedOwnerBelongToDifferentOrg: boolean;
    assignedAccountNotFound: boolean;
    assignedAccountBelongToDifferentOrg: boolean;
    someContactsNotFound: boolean;
    someContactsBelongToDifferentOrg: boolean;
    deal: IDeals | null;
};
type GetAllDealsForCurrentOrganisationServiceResult = {
    deals: IDeals[] | null;
};
type GetOneDealServiceResult = {
    dealBelongsToDifferentOrganisation: boolean;
    notFound: boolean;
    deal: IDeals | null;
};
type UpdateDealServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    dealBelongToDifferentOrg: boolean;
    assignedOwnerNotFound: boolean;
    assignedOwnerBelongToDifferentOrg: boolean;
    someContactsNotFound: boolean;
    someContactsBelongToDifferentOrg: boolean;
    deal: IDeals | null;
};
type DeleteOneDealServiceResult = {
    dealBelongsToDifferentOrganisation: boolean;
    notFound: boolean;
    deal: IDeals | null;
    failed: boolean;
    notAuthorized: boolean;
};