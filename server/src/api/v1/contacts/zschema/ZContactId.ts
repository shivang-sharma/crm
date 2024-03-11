import mongoose from "mongoose";
import z from "zod";

export const ZContactId = z.object({
    contactId: z
        .string({
            description: "ContactId",
            invalid_type_error: "Need to be a valid string",
            required_error: "ContactId is required",
        })
        .refine((contactId) => {
            try {
                new mongoose.Types.ObjectId(contactId);
                return true;
            } catch (error) {
                return false;
            }
        }),
});
