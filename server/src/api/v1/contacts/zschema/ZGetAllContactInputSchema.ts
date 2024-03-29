import { ZCONTACT_STATUS, ZCONTACT_TYPE, ZPRIORITY } from "@/database/enums";
import mongoose from "mongoose";
import z from "zod";

export const ZGetAllContactInputSchema = z.object({
    type: z
        .string({
            invalid_type_error:
                "Invalid Account type, possible values are 'CUSTOMER' | 'PARTNER' | 'VENDOR' | 'QUALIFIED_LEAD'",
        })
        .refine((type) => ZCONTACT_TYPE.safeParse(type).success, {
            message:
                "Invalid Account type, possible values are 'CUSTOMER' | 'PARTNER' | 'VENDOR' | 'QUALIFIED_LEAD'",
        })
        .optional(),
    name: z
        .string({
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    priority: z
        .string({
            description: "PRIORITY 'HIGH' | 'MEDIUM' | 'LOW'",
            invalid_type_error:
                "Invalid priority, possible values are 'HIGH' | 'MEDIUM' | 'LOW'",
        })
        .refine((priority) => ZPRIORITY.safeParse(priority).success, {
            message:
                "Invalid priority, possible values are  'HIGH' | 'MEDIUM' | 'LOW'",
        })
        .optional(),
    status: z
        .string({
            description: "Account status 'ACTIVE' | 'INACTIVE'",
            invalid_type_error:
                "Invalid Account status, possible values are 'ACTIVE' | 'INACTIVE'",
            required_error: "Account status is required",
        })
        .refine((status) => ZCONTACT_STATUS.safeParse(status).success, {
            message:
                "Invalid Account status, possible values are  'ACTIVE' | 'INACTIVE'",
        })
        .optional(),
    account: z
        .string({
            description: "Associated account",
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
