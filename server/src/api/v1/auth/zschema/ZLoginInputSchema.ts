import z from "zod";

export const ZLoginInputSchema = z.object({
    email: z
        .string({
            description: "Email Id",
            invalid_type_error: "Email should be a valid email",
            required_error: "Email is required",
        })
        .email({
            message: "Email should be a valid email",
        }),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(50, "Password must be at most 50 characters long")
        .refine((password) => /^(?=.*\d)(?=.*[a-zA-Z])/.test(password), {
            message: "Password must contain at least one letter and one number",
        }),
});
