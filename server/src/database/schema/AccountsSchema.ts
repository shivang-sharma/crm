import mongoose, { Schema } from "mongoose";
import { IAccounts } from "../model/IAccounts";
import { PRIORITY } from "../enums/EPriority";
import { SIZE } from "../enums/ESize";
import { ACCOUNT_TYPE } from "../enums/EAccountType";

const accountsSchema = new Schema<IAccounts>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            text: true,
        },
        description: {
            type: String,
            min: 50,
            max: 500,
            default: "",
        },
        industry: {
            type: String,
            required: true,
            text: true,
        },
        priority: {
            type: String,
            enum: PRIORITY,
            default: PRIORITY.MEDIUM,
            index: true,
        },
        size: {
            type: String,
            enum: SIZE,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ACCOUNT_TYPE,
            default: ACCOUNT_TYPE.PROSPECT,
            index: true,
        },
        organisation: {
            type: Schema.Types.ObjectId,
            ref: "Organisations",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Accounts = mongoose.model<IAccounts>("Accounts", accountsSchema);
