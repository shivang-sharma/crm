import z from "zod";

export const ZChangeOwnerInputSchema = z.object({
    organisationId: z.string().uuid({
        message: "OrganisationId need to be a valid UUID",
    }),
    newOwner: z.string().uuid({
        message: "NewOwner need to be a valid UUID",
    }),
});
