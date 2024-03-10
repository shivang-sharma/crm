import { Schema } from "mongoose";
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
