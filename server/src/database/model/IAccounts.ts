import mongoose, { Document } from "mongoose";
import { ACCOUNT_TYPE } from "../enums/EAccountType";
import { PRIORITY } from "../enums/EPriority";
import { SIZE } from "../enums/ESize";

export interface IAccounts extends Document {
    name: string;
    priority: PRIORITY;
    industry: string;
    description: string;
    size: SIZE;
    type: ACCOUNT_TYPE;
    organisation: mongoose.Types.ObjectId;
}
