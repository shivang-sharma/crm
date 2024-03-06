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
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        priority: {
            type: Number,
            enum: PRIORITY,
            default: PRIORITY.LOW,
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: "Accounts",
        },
        status: {
            type: Number,
            enum: CONTACT_STATUS,
            default: CONTACT_STATUS.ACTIVE,
        },
        type: {
            type: Number,
            enum: CONTACT_TYPE,
        },
    },
    {
        timestamps: true,
    }
);

export const Contacts = mongoose.model<IContacts>("Contacts", contactsSchema);
