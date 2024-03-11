import { IOrganisations, IUsers } from "@/database";
import { ROLE } from "@/database/enums/ERole";
import {
    CreateNewOrganisation,
    DeleteAccountsByOrganisationId,
    DeleteDealsByOrganisationId,
    DeleteOrganisationById,
    FindOneOrganisationById,
    FindOneOrganisationByName,
    FindOneUserById,
    FindOrganisationByIdAndUpdateOwner,
    FindUserByIdAndUpdateOrganisationAndRole,
    FindUserByIdAndUpdateRole,
    FindUserByOrganisationIdAndUpdateOrganisationAndRole,
} from "@/database/queries";
import { DeleteContactByOrganisationId } from "@/database/queries/ContactQueries";
import { DeleteLeadByOrganisationId } from "@/database/queries/LeadQueries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export class OrganisationsService {
    async createOrganisationService(
        correlationId: string,
        currentUser: IUsers,
        name: string
    ) {
        // Starting transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: CreateOrganisationsServiceResult = {
                organisationWithNameAlreadyExist: false,
                alreadyAssociatedWithOrg: false,
                failed: false,
                org: null,
            };
            // if user is member, owner or read_only of any organisatio then reject the request
            // because the user can only either be a member or admin of an org
            if (
                (currentUser.role === ROLE.ADMIN ||
                    currentUser.role === ROLE.MEMBER ||
                    currentUser.role === ROLE.READ_ONLY) &&
                currentUser.organisation
            ) {
                response.alreadyAssociatedWithOrg = true;
                response.failed = true;
                logger.warn(
                    `Organisation creation failed because currentUser is already associated with an Org. currentUser: ${currentUser.toJSON()} correlationId: ${correlationId} `
                );
                return response;
            }
            const exists = await FindOneOrganisationByName(name);
            if (exists) {
                response.organisationWithNameAlreadyExist = true;
                response.failed = true;
                logger.warn(
                    `Organisation with name already exists for name:${name} correlationId:${correlationId}`
                );
                return response;
            }
            const createdOrg = await CreateNewOrganisation(
                name,
                currentUser._id
            );
            logger.info(
                `Organisation created ${createdOrg.toJSON()} correlationId: ${correlationId}`
            );
            // update currentUser with the org id and role as owner
            const updatedUser = await FindUserByIdAndUpdateOrganisationAndRole(
                currentUser.id,
                createdOrg._id,
                ROLE.ADMIN
            );
            logger.info(
                `User: ${updatedUser?.id} role: ${updatedUser?.role} of organisation ${createdOrg.id} correlationId: ${correlationId} `
            );
            await session.commitTransaction();
            await session.endSession();
            logger.info(
                `Create organisation transaction commited corrleationId: ${correlationId}`
            );
            response.org = createdOrg;
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.debug(
                `Create organisation transaction aborted corrleationId: ${correlationId}`
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
    async getOneOrganisationService(
        correlationId: string,
        currentUser: IUsers,
        organisationId: string
    ) {
        try {
            const response: GetOrganisationServiceResult = {
                notAuthorized: false,
                notFound: false,
                org: null,
            };
            // if currentUser: is not associated with the organisation then reject the request
            // because not allowed to access the organisation information if not associated with it
            if (!currentUser.organisation.equals(organisationId)) {
                response.notAuthorized = true;
                logger.warn(
                    `User tried to access organisation, it is not associated with. currentUser: ${currentUser.toJSON()}, organisationId: ${organisationId}, correlationId: ${correlationId} `
                );
                return response;
            }
            const org = await FindOneOrganisationById(
                new mongoose.Types.ObjectId(organisationId)
            );
            logger.info(
                `Retrieved organisation with Id:${organisationId} organisation:${org?.toJSON()}, correlationId: ${correlationId}`
            );
            if (!org) {
                response.notFound = true;
                logger.warn(
                    `Organisation with id:${organisationId} does not exist`
                );
                return response;
            }
            response.org = org;
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
    async changeOwnerService(
        correlationId: string,
        currentUser: IUsers,
        organisationId: string,
        newOwnerId: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: ChangeOwnerServiceResult = {
                newOwnerNotFound: false,
                newOwnerBelongToDifferentOrg: false,
                notAuthorized: false,
                organisationNotFound: false,
                failed: false,
                org: null,
                newOwner: null,
            };
            // if the currentUser does not have ADMIN role then reject request
            // because need to be ADMIN to change the owner
            if (
                currentUser.role !== ROLE.ADMIN ||
                !currentUser.organisation.equals(organisationId)
            ) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to change the owner of organisationId: ${organisationId}, currentUser:${currentUser.toJSON()} for correlationId:${correlationId}`
                );
                return response;
            }
            const newOwner = await FindOneUserById(newOwnerId);
            // If new owner does not exist then reject the request
            if (!newOwner) {
                response.newOwnerNotFound = true;
                logger.warn(
                    `New Owner does not exist newOwnerId:${newOwnerId}, correlationId:${correlationId}`
                );
                return response;
            } else if (
                // if the new owner already belong to a different organisation reject request
                newOwner.organisation &&
                !newOwner.organisation.equals(organisationId)
            ) {
                response.newOwnerBelongToDifferentOrg = true;
                logger.warn(
                    `New Owner already associated with a different organisation newOwner:${newOwner.toJSON()} organisationId:${organisationId} for correlationId:${correlationId}`
                );
                return response;
            }
            // Update owner for org
            const updatedOrg = await FindOrganisationByIdAndUpdateOwner(
                new mongoose.Types.ObjectId(organisationId),
                new mongoose.Types.ObjectId(newOwnerId)
            );
            if (!updatedOrg) {
                response.failed = true;
                logger.warn(
                    `Failed to updated organisation for some unkown reason organisationId:${organisationId} for correlationId:${correlationId}`
                );
                return response;
            }
            // Update new owner role
            const updatedNewOwner = await FindUserByIdAndUpdateRole(
                newOwnerId,
                ROLE.ADMIN
            );
            if (!updatedNewOwner) {
                response.failed = true;
                logger.warn(
                    `Failed to update the role for new owner for unkwnon reason ownerId:${newOwnerId}, correlationId:${correlationId}`
                );
                return response;
            }
            await session.commitTransaction();
            await session.endSession();
            response.org = updatedOrg;
            response.newOwner = updatedNewOwner;
            logger.info(
                `Changed Owner of the organisation successfully newOwner: ${updatedNewOwner}, updatedOrganisation:${updatedOrg} for correlationId:${correlationId}`
            );
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.debug(
                `ChangeOwner transaction aborted corrleationId: ${correlationId}`
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
    async deleteOrganisationService(
        correlationId: string,
        currentUser: IUsers,
        organisationId: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: DeleteOrganisationServiceResult = {
                failed: false,
                notAuthorized: false,
                notFound: false,
                userDoesNotBelongToTheOrg: false,
                noOfLeadsDeleted: 0,
                noOfDealsDeleted: 0,
                noOfContactsDeleted: 0,
                noOfAccountsDeleted: 0,
                noOfUserRemovedFromOrg: 0,
                deletedOrganisation: null,
            };
            // If user is not the owner and ADMIN then reject request
            if (currentUser.role !== ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have ADMIN role to perform this action, action denied userRole:${currentUser.role} for correlationId:${correlationId}`
                );
                return response;
            }
            if (!currentUser.organisation.equals(organisationId)) {
                response.userDoesNotBelongToTheOrg = true;
                logger.warn(
                    `User does not belong to the organisation, action denied userOrg:${currentUser.organisation} orgId:${organisationId} for correlationId:${correlationId}`
                );
                return response;
            }
            const organisation = await FindOneOrganisationById(
                new mongoose.Types.ObjectId(organisationId)
            );
            // if org does not exist
            if (!organisation) {
                response.notFound = true;
                logger.warn(`Organisation not found orgId:${organisationId}`);
                return response;
            }
            // if the currentUser is not the owner then reject
            if (!organisation.owner.equals(currentUser.id)) {
                response.notAuthorized = true;
                logger.warn(
                    `User is not the owner of the organisation, action denied organisationOwner:${organisation.owner} currentUserid:${currentUser.id} correlationId ${correlationId}`
                );
                return response;
            }
            // Delete all the leads associated with the organisation
            const leadDeletedResult = await DeleteLeadByOrganisationId(
                organisationId
            );
            logger.info(
                `All the leads deleted associated with organisationId:${organisationId} leadDeleteResult:${JSON.stringify(
                    leadDeletedResult
                )} correlationId:${correlationId}`
            );
            response.noOfLeadsDeleted = leadDeletedResult.deletedCount;
            // Delete all the deals associated with the organisation
            const dealsDeletedResult = await DeleteDealsByOrganisationId(
                organisationId
            );
            logger.info(
                `All the deals deleted associated with organisationId:${organisationId} dealsDeleteResult:${JSON.stringify(
                    dealsDeletedResult
                )} correlationId:${correlationId}`
            );
            response.noOfDealsDeleted = dealsDeletedResult.deletedCount;
            // Delete all the contacts associated with the organisation
            const contactDeletedResult = await DeleteContactByOrganisationId(
                organisationId
            );
            logger.info(
                `All the contacts deleted associated with organisationId:${organisationId} contactDeleteResult:${JSON.stringify(
                    contactDeletedResult
                )} correlationId:${correlationId}`
            );
            response.noOfContactsDeleted = contactDeletedResult.deletedCount;
            // Delete all the accounts associated with the organisation
            const accountDeletedResult = await DeleteAccountsByOrganisationId(
                organisationId
            );
            logger.info(
                `All the accounts deleted associated with organisationId:${organisationId} accountDeleteResult:${JSON.stringify(
                    accountDeletedResult
                )} correlationId:${correlationId}`
            );
            response.noOfAccountsDeleted = accountDeletedResult.deletedCount;
            // Remove all the users from the organisation
            const userUpdateResult =
                await FindUserByOrganisationIdAndUpdateOrganisationAndRole(
                    organisationId,
                    null,
                    null
                );
            logger.info(
                `All the users removed from the organisation organisationId:${organisationId} usersRemovedResult:${JSON.stringify(
                    userUpdateResult
                )} correlationId:${correlationId}`
            );
            response.noOfUserRemovedFromOrg = userUpdateResult.modifiedCount;
            response.deletedOrganisation = organisation;
            const deleteResult = await DeleteOrganisationById(organisationId);
            if (deleteResult.deletedCount !== 1) {
                await session.abortTransaction();
                await session.endSession();
                response.failed = true;
                return response;
            }
            await session.commitTransaction();
            await session.endSession();
            logger.info(`Delete organisation transation commited`);
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.debug(
                `DeleteOrganisation transaction aborted corrleationId: ${correlationId}`
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

export type CreateOrganisationsServiceResult = {
    organisationWithNameAlreadyExist: boolean;
    alreadyAssociatedWithOrg: boolean;
    failed: boolean;
    org: IOrganisations | null;
};

export type GetOrganisationServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    org: IOrganisations | null;
};

export type ChangeOwnerServiceResult = {
    notAuthorized: boolean;
    newOwnerNotFound: boolean;
    newOwnerBelongToDifferentOrg: boolean;
    organisationNotFound: boolean;
    failed: boolean;
    org: IOrganisations | null;
    newOwner: IUsers | null;
};

export type DeleteOrganisationServiceResult = {
    failed: boolean;
    notAuthorized: boolean;
    notFound: boolean;
    userDoesNotBelongToTheOrg: boolean;
    noOfLeadsDeleted: number;
    noOfDealsDeleted: number;
    noOfContactsDeleted: number;
    noOfAccountsDeleted: number;
    noOfUserRemovedFromOrg: number;
    deletedOrganisation: IOrganisations | null;
};
