import z from "zod";

export const ZUpdateUserInputSchema = z.object({
    userId: z
        .string({
            description: "UserId",
            invalid_type_error: "Need to be a valid string",
            required_error: "UserId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
    name: z
        .object({
            fname: z
                .string({
                    description: "First Name",
                    invalid_type_error: "First name should be a valid string.",
                })
                .min(1, "FullName cannot be empty")
                .optional(),
            lname: z
                .string({
                    description: "Last Name",
                    invalid_type_error: "Last Name should be a valid string.",
                })
                .min(1, "Last Name cannot be empty")
                .optional(),
        })
        .optional(),
});
