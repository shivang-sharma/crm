import { ZLEAD_STATUS } from "@/database/enums";
import z from "zod";

export const ZChangeStatusInputSchema = z.object({
    leadId: z
        .string({
            description: "Lead id",
            invalid_type_error: "Need to be a valid UUID",
            required_error: "Lead Id is required",
        })
        .uuid({
            message: "Need to be a valid UUID",
        }),
    status: z
        .string({
            description:
                "Lead status 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
            invalid_type_error:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
            required_error: "Lead status is required",
        })
        .refine((status) => ZLEAD_STATUS.safeParse(status).success, {
            message:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
        }),
});
