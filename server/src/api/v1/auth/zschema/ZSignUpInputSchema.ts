import z from "zod";

export const ZSignUpInputSchema = z.object({
    username: z
        .string({
            description: "Username",
            invalid_type_error: "Username should be a valid string",
            required_error: "Username is required",
        })
        .min(8, "Username should be of minimum 8 character"),
    name: z.object({
        fname: z
            .string({
                description: "First Name",
                invalid_type_error: "First name should be a valid string.",
                required_error: "First Name is required",
            })
            .min(1, "FullName cannot be empty"),
        lname: z
            .string({
                description: "Last Name",
                invalid_type_error: "Last Name should be a valid string.",
            })
            .min(1, "Last Name cannot be empty")
            .optional()
            .default(""),
    }),
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
