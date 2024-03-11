import mongoose, { Document } from "mongoose";
import { STAGE } from "../enums/EStage";
import { PRIORITY } from "../enums/EPriority";
import { Value } from "../types/value";

export interface IDeals extends Document {
    name: string;
    stage: STAGE;
    owner: mongoose.Types.ObjectId;
    value: Value;
    contacts: mongoose.Types.ObjectId[];
    account: mongoose.Types.ObjectId;
    priority: PRIORITY;
    expectedCloseDate: Date;
    closeProbability: number;
    actualValue: Value;
    closedAt: Date;
    organisation: mongoose.Types.ObjectId;
}
