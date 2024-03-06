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
            type: [Schema.Types.ObjectId],
            minlength: 1,
            ref: "Contacts",
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: "Accounts",
            required: true,
        },
        priority: {
            type: Number,
            enum: PRIORITY,
            default: PRIORITY.LOW,
        },
        expectedCloseDate: {
            type: Date,
        },
        closeProbability: {},
        actualValue: {},
        closedAt: {},
    },
    {
        timestamps: true,
    }
);
export const Deals = mongoose.model<IDeals>("Deals", dealsSchema);
