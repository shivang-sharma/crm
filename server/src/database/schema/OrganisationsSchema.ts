import mongoose, { Schema } from "mongoose";
import { IOrganisations } from "../model/IOrganisations";

const organisationsSchema = new Schema<IOrganisations>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users",
        },
    },
    {
        timestamps: true,
    }
);

export const Organisations = mongoose.model<IOrganisations>(
    "Organisations",
    organisationsSchema
);
