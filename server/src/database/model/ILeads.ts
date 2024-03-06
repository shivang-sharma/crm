import mongoose, { Document } from "mongoose";
import { LEAD_STATUS } from "../enums/ELeadStatus";

export interface ILeads extends Document {
    name: string;
    status: LEAD_STATUS;
    owner: mongoose.Types.ObjectId;
    company: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    comments: string;
}
