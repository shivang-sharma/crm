import mongoose, { Schema } from "mongoose";
import { ILeads } from "../model/ILeads";
import { LEAD_STATUS } from "../enums/ELeadStatus";

const leadsSchema = new Schema<ILeads>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            text: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        company: {
            type: String,
            required: true,
        },
        location: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            index: true,
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
            text: true,
        },
        organisation: {
            type: Schema.Types.ObjectId,
            ref: "Organisations",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Leads = mongoose.model<ILeads>("Leads", leadsSchema);
