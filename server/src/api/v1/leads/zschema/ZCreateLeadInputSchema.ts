import z from "zod";
import countries from "i18n-iso-countries";
import { phone } from "phone";
import { ZLEAD_STATUS } from "@/database/enums";
import mongoose from "mongoose";

export const ZCreateLeadInputSchema = z.object({
    name: z.string({
        description: "Name of the Lead",
        invalid_type_error: "Name should be a valid string",
        required_error: "Lead Name is required",
    }),
    email: z
        .string({
            description: "Email Id to connect with the Lead",
            invalid_type_error: "Need to be a valid email",
            required_error: "Email Id is required",
        })
        .email({
            message: "Need to be a valid email",
        }),
    company: z.string({
        description: "Name of the company, lead is associated with",
        invalid_type_error: "Need to be a valid string",
        required_error: "Company Name is required",
    }),
    location: z
        .string({
            description: "Location of lead or the associated company",
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    owner: z
        .string({
            description: "Owner(Sales Representative) for the lead",
            invalid_type_error: "Owner need to be a valid UUID",
        })
        .refine((owner) => {
            try {
                new mongoose.Types.ObjectId(owner);
                return true;
            } catch (error) {
                return false;
            }
        })
        .optional(),
    phone: z
        .object({
            country: z
                .string({
                    description:
                        "Need to be a country name or country code in ISO 3166-1 Alpha-2, Alpha-3 or Numeric code i.e US or USA or 840",
                    invalid_type_error:
                        "Need to be a valid country name of code in ISO 3166-1 Alpha-2, Alpha-3 or Numeric code i.e US or USA or 840",
                })
                .refine((country) => countries.isValid(country))
                .optional(),
            number: z.string({
                description:
                    "Phone number with country code or without country code with country code in country paramter",
                invalid_type_error: "Need to be a valid phone number",
            }),
        })
        .refine((p) => {
            if (p.country && countries.isValid(p.country)) {
                const alpha3Code = countries.getAlpha3Code(p.country, "en");
                const validation = phone(p.number, { country: alpha3Code });
                return validation.isValid;
            }
            const validation = phone(p.number);
            return validation.isValid;
        }),
    title: z
        .string({
            description: "Job Title of the contact",
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    status: z
        .string({
            description:
                "Lead status 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
            invalid_type_error:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
            required_error: "Lead status is required",
        })
        .refine((status) => ZLEAD_STATUS.safeParse(status).success, {
            message:
                "Invalid Lead status, possible values are 'NEW_LEAD' | 'ATTEMPTED_TO_CONTACT' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED'",
        })
        .optional(),
    comments: z
        .string({
            description: "Updates",
            invalid_type_error: "Needs to be valid comments",
        })
        .optional(),
});
