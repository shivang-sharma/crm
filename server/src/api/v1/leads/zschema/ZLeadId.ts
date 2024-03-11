import mongoose from "mongoose";
import z from "zod";

export const ZLeadId = z.object({
    leadId: z
        .string({
            description: "LeadId",
            invalid_type_error: "Need to be a valid string",
            required_error: "LeadId is required",
        })
        .refine((leadId) => {
            try {
                new mongoose.Types.ObjectId(leadId);
                return true
            } catch (error) {
                return false;
            }
        }),
});
