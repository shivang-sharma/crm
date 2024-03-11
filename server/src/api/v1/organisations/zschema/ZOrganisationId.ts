import mongoose from "mongoose";
import z from "zod";

export const ZOrganisationId = z.object({
    organisationId: z
        .string({
            invalid_type_error: "Invalid org id",
        })
        .refine((orgId) => {
            try {
                new mongoose.Types.ObjectId(orgId);
                return true;
            } catch (error) {
                return false;
            }
        }),
});
