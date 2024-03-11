import { ZPRIORITY, ZSTAGE } from "@/database/enums";
import mongoose from "mongoose";
import z from "zod";

export const ZGetAllDealsInputSchema = z.object({
    name: z
        .string({
            description: "Name of the deal",
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    stage: z
        .string({
            description:
                "Deal stage 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
            invalid_type_error:
                "Invalid Lead status, possible values are 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
        })
        .refine((stage) => ZSTAGE.safeParse(stage).success, {
            message:
                "Invalid stage, possible values are 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
        })
        .optional(),
    priority: z
        .string({
            description: "Priority 'HIGH' | 'LOW' | 'MEDIUM'",
            invalid_type_error:
                "Invalid priority, possible values are 'HIGH' | 'LOW' | 'MEDIUM'",
        })
        .refine((priority) => ZPRIORITY.safeParse(priority).success, {
            message:
                "Invalid priority, possible values are 'HIGH' | 'LOW' | 'MEDIUM'",
        })
        .optional(),
    owner: z
        .string({
            description: "Owner",
            invalid_type_error: "Need to be a valid string",
        })
        .refine((owner) => {
            try {
                new mongoose.Types.ObjectId(owner);
                return true;
            } catch (error) {
                return false;
            }
        })
        .optional(),
    account: z
        .string({
            description: "Account with which deal associated",
            invalid_type_error: "Account need to be a valid ObjectId",
        })
        .refine((account) => {
            try {
                new mongoose.Types.ObjectId(account);
                return true;
            } catch (error) {
                return false;
            }
        })
        .optional(),
    value_gt: z
        .number({
            description: "Filter for Value greater than",
            invalid_type_error: "Need to be a valid number",
        })
        .optional()
        .default(10000),
    value_lt: z
        .number({
            description: "Filter for Value less than",
            invalid_type_error: "Need to be a valid number",
        })
        .optional()
        .default(1000000),
    close_probability_gt: z
        .number({
            description: "Filter for close probability greater than",
            invalid_type_error: "Need to be a valid number",
        })
        .min(0)
        .max(100)
        .optional()
        .default(60),
    close_probability_lt: z
        .number({
            description: "Filter for close probability less than",
            invalid_type_error: "Need to be a valid number",
        })
        .min(0)
        .max(100)
        .optional()
        .default(60),
    limit: z.number().min(10).max(50).optional().default(10),
    page: z.number().min(1).optional().default(1),
});
