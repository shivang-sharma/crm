import mongoose, { Document } from "mongoose";

export interface IOrganisations extends Document {
    name: string;
    owner: mongoose.Types.ObjectId;
}
