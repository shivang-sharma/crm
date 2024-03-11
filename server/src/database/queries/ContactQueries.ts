import mongoose, { FilterQuery, Schema } from "mongoose";
import { IContacts } from "../model/IContacts";
import { Contacts } from "../schema/ContactsSchema";

export async function CreateNewContact(data: Partial<IContacts>) {
    const contact = await Contacts.create(data);
    return contact;
}

export async function FindManyContactsByOrganisationId(
    organisationId: Schema.Types.ObjectId
) {
    const contacts = await Contacts.find({
        organisation: organisationId,
    });
    return contacts;
}
export async function FindContactByNameOrEmailOrPhonNumber(
    name: string,
    email: string,
    phoneNumber: string
) {
    const contact = await Contacts.findOne({
        $or: [
            { name: name },
            { email: email },
            { "phone.number": phoneNumber },
        ],
    });
    return contact;
}
export async function FindManyContactsBy(
    organisationId: mongoose.Types.ObjectId,
    limit: number,
    page: number,
    account: string | undefined,
    name: string | undefined,
    priority: string | undefined,
    status: string | undefined,
    type: string | undefined
) {
    const filter: FilterQuery<IContacts> = { organisation: organisationId };

    if (account !== undefined) filter.account = account;
    if (name !== undefined) filter.name = name;
    if (priority !== undefined) filter.priority = priority;
    if (status !== undefined) filter.status = status;
    if (type !== undefined) filter.type = type;

    const contacts = await Contacts.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
    return contacts;
}
export async function FindContactById(id: string) {
    const contact = await Contacts.findById(id);
    return contact;
}
export async function FindContactByIdAndUpdate(
    id: string,
    updateData: Partial<IContacts>
) {
    const updatedContact = await Contacts.findByIdAndUpdate(id, updateData);
    return updatedContact;
}
export async function DeleteOneContactById(id: string) {
    const deletedResult = await Contacts.deleteOne({
        _id: id,
    });
    return deletedResult;
}
export async function DeleteContactByOrganisationId(organisationId: string) {
    const deletedResult = await Contacts.deleteMany({
        organisation: organisationId,
    });
    return deletedResult;
}
export async function DeleteContactByAccountId(accountId: string) {
    const deletedResult = await Contacts.deleteMany({
        account: accountId,
    });
    return deletedResult;
}
