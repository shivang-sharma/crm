import mongoose, { Date, Document } from "mongoose";
import { STAGE } from "../enums/EStage";
import { PRIORITY } from "../enums/EPriority";
import { Value } from "../types/value";

export interface IDeals extends Document {
    name: string;
    stage: STAGE;
    owner: mongoose.Schema.Types.ObjectId;
    value: Value;
    contacts: mongoose.Schema.Types.ObjectId[];
    account: mongoose.Schema.Types.ObjectId;
    priority: PRIORITY;
    expectedCloseDate: Date;
    closeProbability: number;
    actualValue: Value;
    closedAt: Date;
    organisation: mongoose.Schema.Types.ObjectId;
}
