import mongoose, { Document } from "mongoose";
import { CONTACT_STATUS } from "../enums/EContactStatus";
import { CONTACT_TYPE } from "../enums/EContactType";
import { PRIORITY } from "../enums/EPriority";

export interface IContacts extends Document {
    type: CONTACT_TYPE;
    title: string;
    name: string;
    priority: PRIORITY;
    phone: {
        countryCode: string;
        countryIso3: string;
        number: string;
    };
    email: string;
    status: CONTACT_STATUS;
    account: mongoose.Types.ObjectId;
    organisation: mongoose.Types.ObjectId;
}
