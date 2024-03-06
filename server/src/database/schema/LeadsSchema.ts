import mongoose, { Schema } from "mongoose";
import { ILeads } from "../model/ILeads";
import { LEAD_STATUS } from "../enums/ELeadStatus";

const leadsSchema = new Schema<ILeads>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            indexes: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        company: {
            type: String,
            required: true,
            index: true,
        },
        location: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users",
        },
        phone: {
            type: String,
            reqjuired: true,
            unique: true,
        },
        title: { type: String },
        status: {
            type: Number,
            enum: LEAD_STATUS,
            default: LEAD_STATUS.NEW_LEAD,
            index: true,
        },
        comments: {
            type: String,
            min: 50,
            max: 500,
        },
    },
    {
        timestamps: true,
    }
);

export const Leads = mongoose.model<ILeads>("Leads", leadsSchema);
