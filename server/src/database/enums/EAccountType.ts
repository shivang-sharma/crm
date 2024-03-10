import z from "zod";

export enum ACCOUNT_TYPE {
    CUSTOMER = "CUSTOMER",
    PARTNER = "PARTNER",
    VENDOR = "VENDOR",
    PROSPECT = "PROSPECT",
}
export const ZACCOUNT_TYPE = z.nativeEnum(ACCOUNT_TYPE);