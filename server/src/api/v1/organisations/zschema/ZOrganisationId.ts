import z from "zod";

export const ZOrganisationId = z.object({
    organisationId: z.string().uuid({
        message: "Organisation id need to be valid",
    }),
});
