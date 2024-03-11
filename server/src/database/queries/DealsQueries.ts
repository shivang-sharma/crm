import mongoose, { FilterQuery, Schema } from "mongoose";
import { IDeals } from "../model/IDeals";
import { Deals } from "../schema/DealsSchema";

export async function CreateNewDeal(data: Partial<IDeals>) {
    const deal = await Deals.create(data);
    return deal;
}
export async function FindManyDealsByOrganisationId(
    organisationId: Schema.Types.ObjectId
) {
    const deals = await Deals.find({
        organisation: organisationId,
    });
    return deals;
}
export async function FindManyDealsBy(
    organisationId: mongoose.Types.ObjectId,
    account: string | undefined,
    close_probability_gt: number,
    close_probability_lt: number,
    name: string | undefined,
    owner: string | undefined,
    priority: string | undefined,
    stage: string | undefined,
    value_gt: number,
    value_lt: number,
    limit: number,
    page: number
) {
    const filter: FilterQuery<IDeals> = { organisation: organisationId };

    const orConditions: FilterQuery<IDeals>[] = [];

    if (account !== undefined) orConditions.push({ account: account });
    if (name !== undefined) orConditions.push({ $text: { $search: name } });
    if (owner !== undefined) orConditions.push({ owner: owner });
    if (priority !== undefined) orConditions.push({ priority: priority });
    if (stage !== undefined) orConditions.push({ stage: stage });
    if (value_gt !== undefined)
        orConditions.push({ "value.amount": { $gt: value_gt } });
    if (value_lt !== undefined)
        orConditions.push({ "value.amount": { $lt: value_lt } });
    if (close_probability_gt !== undefined)
        orConditions.push({ closeProbability: { $gt: close_probability_gt } });
    if (close_probability_lt !== undefined)
        orConditions.push({ closeProbability: { $lt: close_probability_lt } });

    if (orConditions.length > 0) {
        filter.$or = orConditions;
    }

    const deals = await Deals.find(filter)
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .skip((page - 1) * limit);
    return deals;
}
export async function FindDealById(id: string) {
    const deal = await Deals.findById(id);
    return deal;
}
export async function FindDealByIdAndUpdate(
    id: string,
    updateData: Partial<IDeals>
) {
    const updatedDeal = await Deals.findByIdAndUpdate(id, updateData);
    return updatedDeal;
}
export async function DeleteOneDealById(id: string) {
    const deletedResult = await Deals.deleteOne({
        _id: id,
    });
    return deletedResult;
}
export async function DeleteDealsByOrganisationId(organisationId: string) {
    const deletedResult = await Deals.deleteMany({
        organisation: organisationId,
    });
    return deletedResult;
}
export async function DeleteDealsByAccountId(accountId: string) {
    const deletedResult = await Deals.deleteMany({
        account: accountId,
    });
    return deletedResult;
}
export async function RemoveContactFromDealsByContactId(contactId: string) {
    const updatedResult = await Deals.updateMany(
        {
            contacts: contactId,
        },
        {
            $pull: {
                contacts: contactId,
            },
        }
    );
    return updatedResult;
}
export async function FindManyDealsAndRemoveOwner(ownerId: string) {
    const updateResult = await Deals.updateMany(
        {
            owner: ownerId,
        },
        {
            owner: undefined,
        }
    );
    return updateResult;
}
export async function FindDealByName(name: string) {
    const lead = await Deals.findOne({
        name: name,
    });
    return lead;
}
