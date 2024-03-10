import mongoose, { Schema } from "mongoose";
import { IContacts } from "../model/IContacts";
import { PRIORITY } from "../enums/EPriority";
import { CONTACT_STATUS } from "../enums/EContactStatus";
import { CONTACT_TYPE } from "../enums/EContactType";

const contactsSchema = new Schema<IContacts>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            unique: true,
            index: true,
        },
        title: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            required: true,
            unique: true,
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
        priority: {
            type: String,
            enum: PRIORITY,
            default: PRIORITY.LOW,
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: "Accounts",
            default: null,
        },
        status: {
            type: String,
            enum: CONTACT_STATUS,
            default: CONTACT_STATUS.ACTIVE,
        },
        type: {
            type: String,
            enum: CONTACT_TYPE,
            required: true,
        },
        organisation: {
            type: Schema.Types.ObjectId,
            ref: "Organisations",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Contacts = mongoose.model<IContacts>("Contacts", contactsSchema);
