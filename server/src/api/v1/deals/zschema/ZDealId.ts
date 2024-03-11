import mongoose from "mongoose";
import z from "zod";

export const ZDealId = z.object({
    dealId: z
        .string({
            description: "DealId",
            invalid_type_error: "Need to be a valid string",
            required_error: "DealId is required",
        })
        .refine((dealId) => {
            try {
                new mongoose.Types.ObjectId(dealId);
                return true
            } catch (error) {
                return false;
            }
        }),
});
