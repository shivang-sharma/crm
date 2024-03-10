import z from "zod";

export const ZAccountId = z.object({
    accountId: z
        .string({
            description: "AccountId",
            invalid_type_error: "Need to be a valid string",
            required_error: "AccountId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
});
