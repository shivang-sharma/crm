import mongoose from "mongoose";
import z from "zod";

export const ZUserId = z.object({
    userId: z
        .string({
            description: "UserId",
            invalid_type_error: "Need to be a valid ObjectId",
            required_error: "UserId is required",
        })
        .refine((userId) => {
            try {
                new mongoose.Types.ObjectId(userId);
                return true
            } catch (error) {
                return false;
            }
        }),
});
