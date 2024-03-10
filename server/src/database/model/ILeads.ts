import mongoose, { Document } from "mongoose";
import { LEAD_STATUS } from "../enums/ELeadStatus";

export interface ILeads extends Document {
    name: string;
    status: LEAD_STATUS;
    owner: mongoose.Types.ObjectId;
    company: string;
    title: string;
    email: string;
    phone: {
        countryCode: string;
        countryIso3: string;
        number: string;
    };
    location: string;
    comments: string;
    organisation: mongoose.Schema.Types.ObjectId;
}
