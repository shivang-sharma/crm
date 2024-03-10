import { ZACCOUNT_TYPE, ZPRIORITY, ZSIZE } from "@/database/enums";
import z from "zod";

export const ZUpdateAccountInputSchema = z.object({
    accountId: z
        .string({
            description: "AccountId",
            invalid_type_error: "Need to be a valid string",
            required_error: "AccountId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
    name: z
        .string({
            description: "Name of the account",
            invalid_type_error: "Name need to be a valid string",
        })
        .optional(),
    description: z
        .string({
            description: "Description of the account",
            invalid_type_error: "Description need to be a valid string",
        })
        .optional(),
    industry: z
        .string({
            description: "Industry the account belongs to",
            invalid_type_error: "Industry need to be a valid string",
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
});
