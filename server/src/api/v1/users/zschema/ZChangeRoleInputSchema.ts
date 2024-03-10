import { ZROLE } from "@/database/enums";
import z from "zod";

export const ZChangeRoleInputSchema = z.object({
    userId: z
        .string({
            description: "UserId",
            invalid_type_error: "Need to be a valid string",
            required_error: "UserId is required",
        })
        .uuid({
            message: "Need to be a valid UUId",
        }),
    role: z
        .string({
            description: "User role 'ADMIN' | 'MEMBER' | 'READ_ONLY'",
            invalid_type_error:
                "User role, possible values are 'ADMIN' | 'MEMBER' | 'READ_ONLY'",
            required_error: "User role is required",
        })
        .refine((role) => ZROLE.safeParse(role).success, {
            message:
                "Invalid user role, possible values are 'ADMIN' | 'MEMBER' | 'READ_ONLY'",
        }),
});
