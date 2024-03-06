import mongoose from "mongoose";
import { logger } from "@/utils/logger";

export const connectDB = async (uri: string) => {
    try {
        const connectionInstance = await mongoose.connect(uri);
        logger.info(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        logger.error("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

export * from "./schema/AccountsSchema";
export * from "./schema/ContactsSchema";
export * from "./schema/DealsSchema";
export * from "./schema/LeadsSchema";
export * from "./schema/OrganisationsSchema";
export * from "./schema/UsersSchema";
export * from "./model/IAccounts";
export * from "./model/IContacts";
export * from "./model/IDeals";
export * from "./model/ILeads";
export * from "./model/IOrganisations";
export * from "./model/IUsers";
