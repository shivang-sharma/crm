import z from "zod";

export const ZGetAllUserInputSchema = z.object({
    email: z
        .string({
            invalid_type_error: "Need to be a valid email address",
        })
        .email({
            message: "Need to be a valid email address",
        })
        .optional(),
    username: z
        .string({
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(10).max(50).optional().default(10),
});
