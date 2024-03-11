import mongoose from "mongoose";
import { Organisations } from "../schema/OrganisationsSchema";

export async function CreateNewOrganisation(
    name: string,
    owner: mongoose.Types.ObjectId
) {
    const org = new Organisations({
        name: name,
        owner: owner,
    });
    await org.validate();
    const saved = await org.save();
    return saved;
}
export async function FindOneOrganisationByName(name: string) {
    const org = await Organisations.findOne({
        name: name,
    });
    return org;
}
export async function FindOneOrganisationById(
    organisationId: mongoose.Types.ObjectId
) {
    const org = await Organisations.findOne({
        _id: organisationId,
    });
    return org;
}

export async function FindOrganisationByIdAndUpdateOwner(
    organisationId: mongoose.Types.ObjectId,
    newOwnerId: mongoose.Types.ObjectId
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
    return deleteResult;
}
