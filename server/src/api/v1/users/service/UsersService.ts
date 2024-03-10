import { IUsers } from "@/database";
import { ROLE } from "@/database/enums";
import {
    FindManyUsersByOrganisationId,
    FindOneUserById,
    FindUserByIdAndUpdateOrganisationAndRole,
    FindUserByIdAndUpdateRole,
    FindUserByIdAndUpdate,
    FindUserByIdAndDelete,
} from "@/database/queries";
import { FindManyLeadsAndRemoveOwner } from "@/database/queries/LeadQueries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
export class UsersService {
    async getAllUsersForCurrentOrgService(correlationId: string, user: IUsers) {
        try {
            const response: GetAllUsersForCurrentOrganisationServiceResult = {
                users: [],
            };
            const users = await FindManyUsersByOrganisationId(
                user.organisation
            );
            logger.info(
                `Retrieved the users associated with organisationId:${user.organisation} correlationId:${correlationId}`
            );
            response.users = users;
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
    async getOneUserService(
        correlationId: string,
        user: IUsers,
        userId: string
    ) {
        try {
            const response: GetOneUserForCurrentOrganisationServiceResult = {
                notFound: false,
                userBelongToDifferentOrg: false,
                user: null,
            };
            const userObj = await FindOneUserById(userId);
            if (!userObj) {
                response.notFound = true;
                logger.warn(
                    `User not found userId:${userId} correlationId:${correlationId}`
                );
                return response;
            }
            if (userObj.organisation !== user.organisation) {
                response.userBelongToDifferentOrg = true;
                logger.warn(
                    `User belong to a different organisation userOrg:${userObj.organisation} currentUserOrg:${user.organisation}`
                );
                return response;
            }
            logger.info(
                `Successfully retrieved user for userId:${userId} correlationId:${correlationId}`
            );
            response.user = userObj;
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
    async changeRoleService(
        correlationId: string,
        user: IUsers,
        userId: string,
        role: string
    ) {
        try {
            const response: ChangeRoleServiceResult = {
                user: null,
                userBelongToDifferentOrg: false,
                notAuthorized: false,
                notFound: false,
            };
            if (user.role !== ROLE.ADMIN) {
                response.notAuthorized = false;
                logger.warn(
                    `User not authorized to perform the action, userId:${user.id} correlationId:${correlationId}`
                );
                return response;
            }
            const userObj = await FindOneUserById(userId);
            if (!userObj) {
                response.notFound = true;
                logger.warn(
                    `User not found for userId:${userId} for correlationId:${correlationId}`
                );
                return response;
            }
            if (user.organisation !== userObj.organisation) {
                response.userBelongToDifferentOrg = true;
                logger.warn(
                    `User belongs to a different organisation userOrg${userObj.organisation} currentUserOrg:${user.organisation} correlationId:${correlationId}`
                );
            }
            const updatedUser = await FindUserByIdAndUpdateRole(
                userId,
                role.toUpperCase() as ROLE
            );
            if (!updatedUser) {
                response.notFound = true;
                logger.warn(
                    `User not found for userId:${userId} for correlationId:${correlationId}`
                );
                return response;
            }
            response.user = updatedUser;
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
    async removeFromOrganisationService(
        correlationId: string,
        user: IUsers,
        userId: string
    ) {
        const session = await mongoose.startSession();
        try {
            const response: ChangeRoleServiceResult & {
                noOfLeadsModified: number;
            } = {
                notAuthorized: false,
                notFound: false,
                user: null,
                noOfLeadsModified: 0,
                userBelongToDifferentOrg: false,
            };
            if (user.role != ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to perform the action userRole:${user.role} for correlationId:${correlationId}`
                );
                return response;
            }
            const userObj = await FindOneUserById(userId);
            if (!userObj) {
                response.notFound = true;
                logger.warn(
                    `User not found for userId:${userId} for correlationId:${correlationId}`
                );
                return response;
            }
            if (userObj.organisation !== user.organisation) {
                response.userBelongToDifferentOrg = true;
                logger.warn(
                    `User belongs to a different organisation action denied, userOrg:${userObj.organisation} currentUserOrg:${user.organisation} for correlationId:${correlationId}`
                );
                return response;
            }
            session.startTransaction();
            const updatedUser = await FindUserByIdAndUpdateOrganisationAndRole(
                userId,
                undefined,
                undefined
            );
            if (!updatedUser) {
                await session.abortTransaction();
                await session.endSession();
                response.notFound = true;
                logger.warn(
                    `User not found for userId:${userId} for correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `User removed from organisation successfully userId:${userId} for correaltionId:${correlationId}`
            );
            response.user = updatedUser;
            const updateResult = await FindManyLeadsAndRemoveOwner(userId);
            response.noOfLeadsModified = updateResult.modifiedCount;
            logger.info(
                `User removed as owner from all the leads user owned userId:${userId}, noOfLeadsModified:${updateResult.modifiedCount}, changesAcknowledged:${updateResult.acknowledged} for correlationId:${correlationId}`
            );
            // TODO: Remove this user as owner from all the deals user owned
            await session.commitTransaction();
            await session.endSession();
            return response;
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logger.warn(
                `RemoveFromOrg transaction aborted due to error for correlationId:${correlationId}`
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
    async updateUserService(
        correlationId: string,
        user: IUsers,
        userId: string,
        name: { fname?: string; lname?: string } | undefined
    ) {
        try {
            const response: UpdateUserServiceResult = {
                notFound: false,
                notAuthorized: false,
                user: null,
            };
            if (user.id !== userId && user.role !== ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `Cannot update other users details unless you have an ADMIN role, action denied for correlationId:${correlationId}`
                );
                return response;
            }
            const userUpdate: Partial<IUsers> = Object.fromEntries(
                Object.entries({
                    name: name
                        ? Object.fromEntries(
                              Object.entries({
                                  fname: name?.fname,
                                  lname: name?.lname,
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              }).filter(([key, value]) => value !== undefined)
                          )
                        : undefined,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );

            const updatedUser = await FindUserByIdAndUpdate(userId, userUpdate);
            if (!updatedUser) {
                response.notFound = true;
                logger.warn(
                    `User not found userId:${userId}, correlationId:${correlationId}`
                );
                return response;
            }
            response.user = updatedUser;
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
    async deleteUserService(
        correlationId: string,
        user: IUsers,
        userId: string
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const response: DeleteUserServiceResult = {
                noOfLeadsModified: 0,
                failed: false,
                notAuthorized: false,
                user: null,
            };
            if (user.id !== userId) {
                response.notAuthorized = true;
                logger.warn(
                    `User tried to delete another user, action denied currentUser:${user.id} attemptedDeleteOnUserId:${userId} correlatioId:${correlationId}`
                );
                await session.abortTransaction();
                await session.endSession();
                return response;
            }
            const deleteUser = await FindUserByIdAndDelete(userId);
            if (deleteUser) {
                response.failed = true;
                logger.warn(
                    `User deletion failed for some unknown reason userId:${userId} correlatioId:${correlationId}`
                );
                await session.abortTransaction();
                await session.endSession();
                return response;
            }
            logger.info(
                `User deleted successfully userId:${userId} correlatioId:${correlationId}`
            );
            response.user = deleteUser;
            const updateResult = await FindManyLeadsAndRemoveOwner(userId);
            response.noOfLeadsModified = updateResult.modifiedCount;
            logger.info(
                `User removed as owner from all the leads user owned userId:${userId}, noOfLeadsModified:${updateResult.modifiedCount}, changesAcknowledged:${updateResult.acknowledged} for correlationId:${correlationId}`
            );
            // TODO: Remove this user as owner from all the deals user owned
            await session.commitTransaction();
            await session.endSession();
            logger.info(
                `DeleteUser transaction committed for correlationId:${correlationId}`
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
}
type GetAllUsersForCurrentOrganisationServiceResult = {
    users: IUsers[] | null;
};
type GetOneUserForCurrentOrganisationServiceResult = {
    notFound: boolean;
    userBelongToDifferentOrg: boolean;
    user: IUsers | null;
};
type ChangeRoleServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    userBelongToDifferentOrg: boolean;
    user: IUsers | null;
};
type UpdateUserServiceResult = {
    notAuthorized: boolean;
    notFound: boolean;
    user: IUsers | null;
};
type DeleteUserServiceResult = {
    noOfLeadsModified: number;
    failed: boolean;
    notAuthorized: boolean;
    user: IUsers | null;
};
