import z from "zod";

export const ZCreateOrgInputSchema = z.object({
    name: z.string({
        description: "Organisation Name",
        invalid_type_error: "Organisation name needs to be a valid string",
        required_error: "Organisation Name is required",
    }),
});
