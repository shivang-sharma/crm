import { IOrganisations, IUsers } from "@/database";
import { ROLE } from "@/database/enums/ERole";
import {
    CreateNewOrganisation,
    FindOneOrganisationById,
    FindOneUserById,
    FindOrganisationByIdAndUpdateOwner,
    FindUserByIdAndUpdateOrganisationAndRole,
    FindUserByIdAndUpdateRole,
} from "@/database/queries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";
import mongoose, { SchemaTypes } from "mongoose";

export class OrganisationsService {
    async createOrganisationService(
        correlationId: string,
        user: IUsers,
        name: string
    ) {
        // Starting transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: CreateOrganisationsServiceResult = {
                alreadyAssociatedWithOrg: false,
                failed: false,
                org: null,
            };
            // if user is member, owner or read_only of any organisatio then reject the request
            // because the user can only either be a member or admin of an org
            if (
                (user.role === ROLE.ADMIN ||
                    user.role === ROLE.MEMBER ||
                    user.role === ROLE.READ_ONLY) &&
                user.organisation
            ) {
                response.alreadyAssociatedWithOrg = true;
                response.failed = true;
                logger.warn(
                    `Organisation creation failed because user is already associated with an Org. User: ${user.toJSON()} correlationId: ${correlationId} `
                );
                return response;
            }
            const createdOrg = await CreateNewOrganisation(
                name,
                new mongoose.SchemaTypes.ObjectId(user._id)
            );
            logger.info(
                `Organisation created ${createdOrg.toJSON()} correlationId: ${correlationId}`
            );
            // update user with the org id and role as owner
            const updatedUser = await FindUserByIdAndUpdateOrganisationAndRole(
                user.id,
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
        user: IUsers,
        organisationId: string
    ) {
        try {
            const response: GetOrganisationServiceResult = {
                notAuthorized: false,
                notFound: false,
                org: null,
            };
            // if user is not associated with the organisation then reject the request
            // because not allowed to access the organisation information if not associated with it
            if (
                user.organisation !== new SchemaTypes.ObjectId(organisationId)
            ) {
                response.notAuthorized = true;
                logger.warn(
                    `User tried to access organisation, it is not associated with. User: ${user.toJSON()}, organisationId: ${organisationId}, correlationId: ${correlationId} `
                );
                return response;
            }
            const org = await FindOneOrganisationById(
                new SchemaTypes.ObjectId(organisationId)
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
        user: IUsers,
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
            const orgObjectId = new SchemaTypes.ObjectId(organisationId);
            // if the user does not have ADMIN role then reject request
            // because need to be ADMIN to change the owner
            if (user.role !== ROLE.ADMIN || user.organisation !== orgObjectId) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to change the owner of organisationId: ${organisationId}, user:${user.toJSON()} for correlationId:${correlationId}`
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
                newOwner.organisation !== orgObjectId
            ) {
                response.newOwnerBelongToDifferentOrg = true;
                logger.warn(
                    `New Owner already associated with a different organisation newOwner:${newOwner.toJSON()} organisationId:${organisationId} for correlationId:${correlationId}`
                );
                return response;
            }
            // Update owner for org
            const updatedOrg = await FindOrganisationByIdAndUpdateOwner(
                orgObjectId,
                new SchemaTypes.ObjectId(newOwnerId)
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
        user: IUsers,
        organisationId: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // TODO: Delete everything related to organisation
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
