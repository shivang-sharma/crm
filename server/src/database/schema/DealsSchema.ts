import mongoose, { Schema } from "mongoose";
import { IDeals } from "../model/IDeals";
import { STAGE } from "../enums/EStage";
import { CURRENCY } from "../enums/ECurrency";
import { PRIORITY } from "../enums/EPriority";

const dealsSchema = new Schema<IDeals>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        stage: {
            type: Number,
            enum: STAGE,
            default: STAGE.NEW,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users",
        },
        value: {
            amount: {
                type: Number,
                required: true,
            },
            currency: {
                type: Number,
                enum: CURRENCY,
                default: CURRENCY.USD,
            },
        },
        contacts: {
            type: [{ type: Schema.Types.ObjectId, ref: "Contacts" }],
            minlength: 1,
            maxlength: 5,
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: "Accounts",
            required: true,
        },
        priority: {
            type: String,
            enum: PRIORITY,
            default: PRIORITY.LOW,
        },
        expectedCloseDate: {
            type: Date,
        },
        closeProbability: {
            type: Number,
            default: 100,
        },
        actualValue: {
            amount: {
                type: Number,
                default: 0,
            },
            currency: {
                type: Number,
                enum: CURRENCY,
                default: CURRENCY.USD,
            },
        },
        closedAt: {
            type: Date,
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
export const Deals = mongoose.model<IDeals>("Deals", dealsSchema);
