import { Schema } from "mongoose";
import { Organisations } from "../schema/OrganisationsSchema";

export async function CreateNewOrganisation(
    name: string,
    owner: Schema.Types.ObjectId
) {
    const org = await Organisations.create({
        name: name,
        owner: owner,
    });
    return org;
}

export async function FindOneOrganisationById(
    organisationId: Schema.Types.ObjectId
) {
    const org = await Organisations.findOne({
        _id: organisationId,
    });
    return org;
}

export async function FindOrganisationByIdAndUpdateOwner(
    organisationId: Schema.Types.ObjectId,
    newOwnerId: Schema.Types.ObjectId
) {
    const org = await Organisations.findByIdAndUpdate(
        {
            _id: organisationId,
        },
        {
            $set: {
                owner: newOwnerId,
            },
        },
        {
            new: true,
        }
    );
    return org;
}

export async function DeleteOrganisationById(organisationId: string) {
    const deleteResult = await Organisations.deleteOne({
        _id: organisationId,
    });
    return deleteResult
}
