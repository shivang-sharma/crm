import { ZCURRENCY, ZPRIORITY, ZSTAGE } from "@/database/enums";
import mongoose from "mongoose";
import z from "zod";

export const ZUpdateDealInputSchema = z.object({
    dealId: z
        .string({
            description: "DealId",
            invalid_type_error: "Need to be a valid string",
            required_error: "DealId is required",
        })
        .refine((dealId) => {
            try {
                new mongoose.Types.ObjectId(dealId);
                return true;
            } catch (error) {
                return false;
            }
        }),
    name: z
        .string({
            description: "Name of the deal",
            invalid_type_error: "Need to be a valid string",
            required_error: "Name is required",
        })
        .optional(),
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
        })
        .optional(),
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
                .optional(),
        })
        .optional(),
    contacts: z
        .array(
            z
                .string({
                    description: "Contacts associated with the deal",
                    invalid_type_error: "Need to be a valid array of objectId",
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
        .max(5)
        .optional(),
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
