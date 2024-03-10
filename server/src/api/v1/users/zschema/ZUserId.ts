import z from "zod";

export const ZUserId = z.object({
    userId: z
        .string({
            description: "UserId",
            invalid_type_error: "Need to be a valid string",
            required_error: "UserId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
});
