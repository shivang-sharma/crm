import z from "zod";
import countries from "i18n-iso-countries";
import phone from "phone";
import { ZCONTACT_STATUS, ZCONTACT_TYPE, ZPRIORITY } from "@/database/enums";

export const ZUpdateContactInputSchema = z.object({
    contactId: z
        .string({
            description: "ContactId",
            invalid_type_error: "Need to be a valid string",
            required_error: "ContactId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
    name: z
        .string({
            description: "Name of the contact",
            invalid_type_error: "Name should be a valid string",
        })
        .optional(),
    title: z
        .string({
            description: "Job Title of the contact",
            invalid_type_error: "Need to be a valid string",
        })
        .optional(),
    email: z
        .string({
            description: "Email Id to connect with the contact",
            invalid_type_error: "Need to be a valid email",
            required_error: "Email Id is required",
        })
        .email({
            message: "Need to be a valid email",
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
        })
        .optional(),
    priority: z
        .string({
            description: "PRIORITY 'HIGH' | 'MEDIUM' | 'LOW'",
            invalid_type_error:
                "Invalid priority, possible values are 'HIGH' | 'MEDIUM' | 'LOW'",
        })
        .refine((priority) => ZPRIORITY.safeParse(priority).success, {
            message:
                "Invalid priority, possible values are  'HIGH' | 'MEDIUM' | 'LOW'",
        })
        .optional(),
    account: z
        .string({
            description: "Associated account",
            invalid_type_error: "Account need to be a valid UUID",
        })
        .uuid({
            message: "Account need to be a valid UUID",
        })
        .optional(),
    status: z
        .string({
            description: "Account status 'ACTIVE' | 'INACTIVE'",
            invalid_type_error:
                "Invalid Account status, possible values are 'ACTIVE' | 'INACTIVE'",
            required_error: "Account status is required",
        })
        .refine((status) => ZCONTACT_STATUS.safeParse(status).success, {
            message:
                "Invalid Account status, possible values are  'ACTIVE' | 'INACTIVE'",
        })
        .optional(),
    type: z
        .string({
            description:
                "Account type 'CUSTOMER' | 'PARTNER' | 'VENDOR' | 'QUALIFIED_LEAD'",
            invalid_type_error:
                "Invalid Account type, possible values are 'CUSTOMER' | 'PARTNER' | 'VENDOR' | 'QUALIFIED_LEAD'",
            required_error: "Account type is required",
        })
        .refine((type) => ZCONTACT_TYPE.safeParse(type).success, {
            message:
                "Invalid Account type, possible values are 'CUSTOMER' | 'PARTNER' | 'VENDOR' | 'QUALIFIED_LEAD'",
        })
        .optional(),
});
