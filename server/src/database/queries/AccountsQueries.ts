import { Schema } from "mongoose";
import { IAccounts } from "../model/IAccounts";
import { Accounts } from "../schema/AccountsSchema";

export async function CreateAccount(data: Partial<IAccounts>) {
    const account = await Accounts.create(data);
    return account;
}
export async function FindManyAccountsByOrganisationId(
    organisationId: Schema.Types.ObjectId
) {
    const accounts = await Accounts.find({
        organisation: organisationId,
    });
    return accounts;
}
export async function FindAccountById(id: string) {
    const account = await Accounts.findById(id);
    return account;
}

export async function FindAccountByIdAndUpdate(
    id: string,
    updateData: Partial<IAccounts>
) {
    const updatedAccount = await Accounts.findByIdAndUpdate(id, updateData);
    return updatedAccount;
}

export async function DeleteOneAccountById(id: string) {
    const deletedResult = await Accounts.deleteOne({
        _id: id,
    });
    return deletedResult;
}
export async function DeleteAccountsByOrganisationId(organisationId: string) {
    const deletedResult = await Accounts.deleteMany({
        organisation: organisationId,
    });
    return deletedResult;
}
