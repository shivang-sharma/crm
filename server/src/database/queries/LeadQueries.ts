import mongoose, { FilterQuery, Schema } from "mongoose";
import { ILeads } from "../model/ILeads";
import { Leads } from "../schema/LeadsSchema";

export async function CreateNewLead(data: Partial<ILeads>) {
    const lead = await Leads.create({ ...data });
    return lead;
}

export async function FindLeadById(id: string) {
    const lead = await Leads.findById(id);
    return lead;
}

export async function DeleteOneLeadById(id: string) {
    const deletedResult = await Leads.deleteOne({
        _id: id,
    });
    return deletedResult;
}

export async function FindManyLeadsByOrganisationId(
    organisationId: Schema.Types.ObjectId
) {
    const leads = await Leads.find({
        organisation: organisationId,
    });
    return leads;
}

export async function FindManyLeadsBy(
    organisationId: mongoose.Types.ObjectId,
    limit: number,
    page: number,
    name: string | undefined,
    owner: string | undefined,
    status: string | undefined
) {
    const filter: FilterQuery<ILeads> = { organisation: organisationId };

    const orConditions: FilterQuery<ILeads>[] = [];

    if (name !== undefined) orConditions.push({ $text: { $search: name } });
    if (owner !== undefined) orConditions.push({ owner: owner });
    if (status !== undefined) orConditions.push({ status: status });

    if (orConditions.length > 0) {
        filter.$or = orConditions;
    }

    const leads = await Leads.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
    return leads;
}

export async function FindLeadByIdAndUpdate(
    id: string,
    updateData: Partial<ILeads>
) {
    const updatedLead = await Leads.findByIdAndUpdate(id, updateData, {
        new: true,
    });
    return updatedLead;
}

export async function FindManyLeadsAndRemoveOwner(ownerId: string) {
    const updateResult = await Leads.updateMany(
        {
            owner: ownerId,
        },
        {
            owner: null,
        }
    );
    return updateResult;
}
export async function DeleteLeadByOrganisationId(organisationId: string) {
    const deletedResult = await Leads.deleteMany({
        organisation: organisationId,
    });
    return deletedResult;
}
export async function FindLeadByNameOrEmailOrPhonNumber(
    name: string,
    email: string,
    phoneNumber: string
) {
    const lead = await Leads.findOne({
        $or: [
            { name: name },
            { email: email },
            { "phone.number": phoneNumber },
        ],
    });
    return lead;
}
