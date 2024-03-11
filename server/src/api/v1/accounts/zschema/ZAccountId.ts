import mongoose from "mongoose";
import z from "zod";

export const ZAccountId = z.object({
    accountId: z
        .string({
            description: "AccountId",
            invalid_type_error: "Need to be a valid ObjectId",
            required_error: "AccountId is required",
        })
        .refine((accountId) => {
            try {
                new mongoose.Types.ObjectId(accountId);
                return true
            } catch (error) {
                return false;
            }
        }),
});
