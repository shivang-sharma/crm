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
            text: true,
        },
        stage: {
            type: String,
            enum: STAGE,
            default: STAGE.NEW,
            index: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            index: true,
            default: null,
        },
        value: {
            amount: {
                type: Number,
                required: true,
                index: true,
            },
            currency: {
                type: String,
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
            index: true,
        },
        priority: {
            type: String,
            enum: PRIORITY,
            default: PRIORITY.LOW,
            index: true,
        },
        expectedCloseDate: {
            type: Date,
            default: null,
        },
        closeProbability: {
            type: Number,
            default: 100,
            index: true,
        },
        actualValue: {
            amount: {
                type: Number,
                default: 0,
            },
            currency: {
                type: String,
                enum: CURRENCY,
                default: CURRENCY.USD,
            },
        },
        closedAt: {
            type: Date,
            default: null,
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
export const Deals = mongoose.model<IDeals>("Deals", dealsSchema);
