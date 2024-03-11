import { ZACCOUNT_TYPE, ZPRIORITY, ZSIZE } from "@/database/enums";
import z from "zod";

export const ZGetAllAccountInputSchema = z.object({
    name: z
        .string({
            description: "Name of the account",
            invalid_type_error: "Name need to be a valid string",
        })
        .optional(),
    priority: z
        .string({
            description:
                "Priority for the account HIGH | MEDIUM | LOW the account belongs to",
            invalid_type_error:
                "Priority should be a valid value HIGH | MEDIUM | LOW",
        })
        .refine((priority) => ZPRIORITY.safeParse(priority).success)
        .optional(),
    size: z
        .string({
            description: "Size of the account MICRO | SMALL | MID | LARGE",
            invalid_type_error:
                "Size should be a valid value MICRO | SMALL | MID | LARGE",
            required_error: "Size is required",
        })
        .refine((size) => ZSIZE.safeParse(size).success)
        .optional(),
    type: z
        .string({
            description:
                "Type of the account PROSPECT | CUSTOMER | VENDOR | PARTNER",
            invalid_type_error:
                "Type should be valid value PROSPECT | CUSTOMER | VENDOR | PARTNER",
        })
        .refine((type) => ZACCOUNT_TYPE.safeParse(type).success)
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
