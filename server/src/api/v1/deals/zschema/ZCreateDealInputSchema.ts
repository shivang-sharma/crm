import { CURRENCY, ZCURRENCY, ZPRIORITY, ZSTAGE } from "@/database/enums";
import mongoose from "mongoose";
import z from "zod";

export const ZCreateDealInputSchema = z.object({
    name: z.string({
        description: "Name of the deal",
        invalid_type_error: "Need to be a valid string",
        required_error: "Name is required",
    }),
    stage: z
        .string({
            description:
                "Deal stage 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
            invalid_type_error:
                "Invalid Lead status, possible values are 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
        })
        .refine((stage) => ZSTAGE.safeParse(stage).success, {
            message:
                "Invalid stage, possible values are 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON'| 'LOST'",
        })
        .optional(),
    owner: z
        .string({
            description: "Owner",
            invalid_type_error: "Need to be a valid string",
            required_error: "Owner is required",
        })
        .refine((owner) => {
            try {
                new mongoose.Types.ObjectId(owner);
                return true;
            } catch (error) {
                return false;
            }
        }),
    value: z
        .object({
            amount: z.number(),
            currency: z
                .string({
                    description: "Currency 'USD' | 'INR'",
                    invalid_type_error:
                        "Invalid currency, possible values are 'USD' | 'INR'",
                })
                .refine((currency) => ZCURRENCY.safeParse(currency).success, {
                    message:
                        "Invalid currency, possible values are 'USD' | 'INR'",
                })
                .optional()
                .default(CURRENCY.USD),
        })
        .default({ amount: 0 }),
    contacts: z
        .array(
            z
                .string({
                    description: "Contacts associated with the deal",
                    invalid_type_error: "Need to be a valid array of uuid",
                    required_error:
                        "At least 1 contact associated with the deal is required",
                })
                .refine((contact) => {
                    try {
                        new mongoose.Types.ObjectId(contact);
                        return true;
                    } catch (error) {
                        return false;
                    }
                })
        )
        .min(1, {
            message: "At least 1 contact associated with the deal is required",
        })
        .max(5),
    account: z
        .string({
            description: "Account with which deal associated",
            invalid_type_error: "Account need to be a valid uuid",
            required_error: "Associate account is required",
        })
        .refine((account) => {
            try {
                new mongoose.Types.ObjectId(account);
                return true;
            } catch (error) {
                return false;
            }
        }),
    priority: z
        .string({
            description: "Priority 'HIGH' | 'LOW' | 'MEDIUM'",
            invalid_type_error:
                "Invalid priority, possible values are 'HIGH' | 'LOW' | 'MEDIUM'",
        })
        .refine((priority) => ZPRIORITY.safeParse(priority).success, {
            message:
                "Invalid priority, possible values are 'HIGH' | 'LOW' | 'MEDIUM'",
        })
        .optional(),
    expectedCloseDate: z
        .date({
            description: "Expected close date for deal",
            invalid_type_error: "Need to be a valid date",
        })
        .optional(),
    closeProbability: z
        .number({
            description: "Close probability is the percentage out of 100",
            invalid_type_error:
                "Need to be a valid percentage in the range of 0-100",
        })
        .min(0)
        .max(100)
        .optional(),
    actualValue: z
        .object({
            amount: z.number({
                description: "Actual value of the deal",
            }),
            currency: z
                .string({
                    description: "Currency 'USD' | 'INR'",
                    invalid_type_error:
                        "Invalid currency, possible values are 'USD' | 'INR'",
                })
                .refine((currency) => ZCURRENCY.safeParse(currency).success, {
                    message:
                        "Invalid currency, possible values are 'USD' | 'INR'",
                })
                .optional(),
        })
        .optional(),
    closedAt: z
        .date({
            description: "Closed date of the deal",
            invalid_type_error: "Need to be a valid date",
        })
        .optional(),
});
