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
            countryCode: {
                type: String,
                required: true,
            },
            countryIso3: {
                type: String,
                required: true,
            },
            number: {
                type: String,
                required: true,
                unique: true,
            },
        },
        title: { type: String },
        status: {
            type: String,
            enum: LEAD_STATUS,
            default: LEAD_STATUS.NEW_LEAD,
            index: true,
        },
        comments: {
            type: String,
            min: 50,
            max: 500,
        },
        organisation: {
            type: Schema.Types.ObjectId,
            ref: "Organisations",
        },
    },
    {
        timestamps: true,
    }
);

export const Leads = mongoose.model<ILeads>("Leads", leadsSchema);
