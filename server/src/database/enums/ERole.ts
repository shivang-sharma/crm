import z from "zod";

export enum ROLE {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    READ_ONLY = "READ_ONLY",
}
export const ZROLE = z.nativeEnum(ROLE);
