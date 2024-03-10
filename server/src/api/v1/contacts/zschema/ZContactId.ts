import z from "zod";

export const ZContactId = z.object({
    contactId: z
        .string({
            description: "ContactId",
            invalid_type_error: "Need to be a valid string",
            required_error: "ContactId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
});
