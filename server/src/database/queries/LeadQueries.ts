import { Schema } from "mongoose";
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

export async function FindLeadByIdAndUpdate(
    id: string,
    updateData: Partial<ILeads>
) {
    const updatedLead = await Leads.findByIdAndUpdate(id, updateData);
    return updatedLead;
}

export async function FindManyLeadsAndRemoveOwner(ownerId: string, ) {
    const updateResult = await Leads.updateMany(
        {
            owner: ownerId,
        },
        {
            owner: undefined,
        }
    );
    return updateResult;
}
