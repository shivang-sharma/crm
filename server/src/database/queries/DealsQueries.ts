import { Schema } from "mongoose";
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
