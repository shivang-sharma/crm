import { ZLEAD_STATUS } from "@/database/enums";
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
        .uuid({
            message: "Owner need to be a valid UUID",
        })
        .optional(),
    comments: z.string().optional(),
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(10).max(50).optional().default(10),
});
