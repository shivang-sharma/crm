import { IAccounts, IUsers } from "@/database";
import { ROLE } from "@/database/enums";
import {
    CreateAccount,
    DeleteOneAccountById,
    FindAccountById,
    FindAccountByIdAndUpdate,
    FindManyAccountsByOrganisationId,
} from "@/database/queries";
import { ApiError } from "@/utils/error/ApiError";
import { logger } from "@/utils/logger";
import { StatusCodes } from "http-status-codes";

export class AccountsService {
    async createAccountService(
        correlationId: string,
        user: IUsers,
        description: string,
        industry: string,
        name: string,
        size: string,
        priority: string | undefined,
        type: string | undefined
    ) {
        try {
            const response: CreateAccountServiceResult = {
                notAuthorized: false,
                account: null,
            };
            // If user has READ_ONLY role reject the request
            if (user.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `Account creation failed because user has READ_ONLY roles, User: ${user.toJSON()} correlationId:${correlationId}`
                );
                return response;
            }
            const newAccountData: Partial<IAccounts> = Object.fromEntries(
                Object.entries({
                    description,
                    industry,
                    name,
                    size,
                    priority,
                    type,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );
            newAccountData.organisation = user.organisation;
            const newAccount = await CreateAccount(newAccountData);
            logger.info(
                `Account created ${newAccount.toJSON()} correlationId:${correlationId}`
            );
            response.account = newAccount;
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
    async getAllAccountsForCurrentOrgService(
        correlationId: string,
        user: IUsers
    ) {
        try {
            const response: GetAllAccountsForCurrentOrganisationServiceResult =
                {
                    accounts: [],
                };
            const accounts = await FindManyAccountsByOrganisationId(
                user.organisation
            );
            logger.info(
                `Retrieved the accounts associated with organisationId:${user.organisation} correlationId:${correlationId}`
            );
            response.accounts = accounts;
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
    async getOneAccountService(
        correlationId: string,
        user: IUsers,
        accountId: string
    ) {
        try {
            const response: GetOneAccountServiceResult = {
                accountBelongsToDifferentOrganisation: false,
                notFound: false,
                account: null,
            };
            const account = await FindAccountById(accountId);
            if (!account) {
                response.notFound = true;
                logger.warn(
                    `Account not found accountId:${accountId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the account belong to different org reject the request
            if (account.organisation !== user.organisation) {
                response.accountBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Account belongs to a different organisation access denied for accountId:${accountId} accountOrg:${account.organisation} userOrg:${user.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Successfully retrieved account for accountId:${accountId} correlationId:${correlationId}`
            );
            response.account = account;
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
    async updateAccountService(
        correlationId: string,
        user: IUsers,
        accountId: string,
        description: string | undefined,
        industry: string | undefined,
        name: string | undefined,
        priority: string | undefined,
        size: string | undefined,
        type: string | undefined
    ) {
        try {
            const response: CreateAccountServiceResult & {
                notFound: boolean;
                accountBelongToDifferentOrg: boolean;
            } = {
                account: null,
                notAuthorized: false,
                notFound: false,
                accountBelongToDifferentOrg: false,
            };
            const account = await FindAccountById(accountId);
            if (!account) {
                response.notFound = true;
                logger.warn(
                    `Account does not exist accountId: ${accountId} correlationId:${correlationId}`
                );
                return response;
            }
            // If user has READ_ONLY role then reject
            if (user.role === ROLE.READ_ONLY) {
                response.notAuthorized = true;
                logger.warn(
                    `User has READ_ONLY role, action denied, correlationId:${correlationId}`
                );
                return response;
            }
            // If user does not belong to the same org reject
            if (user.organisation !== account.organisation) {
                response.accountBelongToDifferentOrg = true;
                logger.warn(
                    `Account belong to a different organisation, action denied userOrg:${user.organisation} accountOrg:${account.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            const accountUpdateData: Partial<IAccounts> = Object.fromEntries(
                Object.entries({
                    description,
                    industry,
                    name,
                    priority,
                    size,
                    type,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).filter(([key, value]) => value !== undefined)
            );
            const updatedAccount = await FindAccountByIdAndUpdate(
                accountId,
                accountUpdateData
            );
            if (!updatedAccount) {
                response.notFound = true;
                logger.warn(
                    `Account does not exist accountId: ${accountId} correlationId:${correlationId}`
                );
                return response;
            }
            logger.info(
                `Account updated ${updatedAccount.toJSON()} correlationId:${correlationId}`
            );
            response.account = updatedAccount;
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
    async deleteOneAccountService(
        correlationId: string,
        user: IUsers,
        accountId: string
    ) {
        try {
            const response: DeleteOneAccountServiceResult = {
                accountBelongsToDifferentOrganisation: false,
                notAuthorized: false,
                notFound: false,
                failed: false,
                account: null,
            };
            if (user.role != ROLE.ADMIN) {
                response.notAuthorized = true;
                logger.warn(
                    `User does not have sufficient privileges to perform the action, action denied userRole:${user.role} for correlationId:${correlationId}`
                );
                return response;
            }
            const account = await FindAccountById(accountId);
            if (!account) {
                response.notFound = true;
                logger.warn(
                    `Account not found accountId:${accountId} for correlationId:${correlationId}`
                );
                return response;
            }
            // if the account belong to different org reject the request
            if (account.organisation !== user.organisation) {
                response.accountBelongsToDifferentOrganisation = true;
                logger.warn(
                    `Account belongs to a different organisation access denied for accountId:${accountId} accountOrg:${account.organisation} userOrg:${user.organisation} correlationId:${correlationId}`
                );
                return response;
            }
            const deletedResult = await DeleteOneAccountById(accountId);
            if (
                deletedResult.deletedCount === 0 ||
                !deletedResult.acknowledged
            ) {
                logger.warn(
                    `Couldn't delete the account for unknown reason deleteResult:${deletedResult} accountId:${accountId}, for correlationId:${correlationId}`
                );
                response.failed = true;
                return response;
            }
            logger.info(
                `Account deleted successfully accountId:${accountId}, correlationId:${correlationId}`
            );
            response.account = account;
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

export type CreateAccountServiceResult = {
    notAuthorized: boolean;
    account: IAccounts | null;
};
export type GetAllAccountsForCurrentOrganisationServiceResult = {
    accounts: IAccounts[];
};
export type GetOneAccountServiceResult = {
    accountBelongsToDifferentOrganisation: boolean;
    notFound: boolean;
    account: IAccounts | null;
};
export type DeleteOneAccountServiceResult = {
    notAuthorized: boolean;
    accountBelongsToDifferentOrganisation: boolean;
    notFound: boolean;
    failed: boolean;
    account: IAccounts | null;
};
