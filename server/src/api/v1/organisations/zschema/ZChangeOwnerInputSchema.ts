import mongoose from "mongoose";
import z from "zod";

export const ZChangeOwnerInputSchema = z.object({
    organisationId: z.string().refine((orgId) => {
        try {
            new mongoose.Types.ObjectId(orgId);
            return true;
        } catch (error) {
            return false;
        }
    }),
    newOwner: z
        .string({
            description: "New owner need to be a valid ObjectId",
        })
        .refine((owner) => {
            try {
                new mongoose.Types.ObjectId(owner);
                return true;
            } catch (error) {
                return false;
            }
        }),
});
