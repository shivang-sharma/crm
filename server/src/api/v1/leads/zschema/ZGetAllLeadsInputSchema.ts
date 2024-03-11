import { ZLEAD_STATUS } from "@/database/enums";
import mongoose from "mongoose";
import z from "zod";

export const ZGetAllLeadsInputSchema = z.object({
    name: z.string().optional(),
    status: z
        .string({
            description:
                "Lead status 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
            invalid_type_error:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
        })
        .refine((status) => ZLEAD_STATUS.safeParse(status).success, {
            message:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
        })
        .optional(),
    owner: z
        .string({
            description: "Owner(Sales Representative) for the lead",
            invalid_type_error: "Owner need to be a valid UUID",
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
    page: z
        .string()
        .refine(
            (page) => {
                try {
                    const p = parseInt(page);
                    if (p < 1) return false;
                    return true;
                } catch (error) {
                    return false;
                }
            },
            { message: "Need to be valid number greater than 0" }
        )
        .optional()
        .default("1"),
    limit: z
        .string()
        .refine(
            (limit) => {
                try {
                    const p = parseInt(limit);
                    if (p < 10) return false;
                    if (p > 50) return false;
                    return true;
                } catch (error) {
                    return false;
                }
            },
            { message: "Need to be valid number between 10 - 50" }
        )
        .optional()
        .default("10"),
});
