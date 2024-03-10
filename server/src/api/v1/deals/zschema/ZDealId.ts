import z from "zod";

export const ZDealId = z.object({
    dealId: z
        .string({
            description: "DealId",
            invalid_type_error: "Need to be a valid string",
            required_error: "DealId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
});
