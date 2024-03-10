import z from "zod";

export const ZLeadId = z.object({
    leadId: z
        .string({
            description: "LeadId",
            invalid_type_error: "Need to be a valid string",
            required_error: "LeadId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
});
