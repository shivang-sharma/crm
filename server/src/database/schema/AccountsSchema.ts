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
            index: true,
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
        },
        priority: {
            type: String,
            enum: PRIORITY,
            default: PRIORITY.MEDIUM,
        },
        size: {
            type: String,
            enum: SIZE,
            required: true,
        },
        type: {
            type: String,
            enum: ACCOUNT_TYPE,
            default: ACCOUNT_TYPE.PROSPECT,
        },
    },
    {
        timestamps: true,
    }
);

export const Accounts = mongoose.model<IAccounts>("Accounts", accountsSchema);
