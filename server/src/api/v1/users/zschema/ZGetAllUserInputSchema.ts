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
