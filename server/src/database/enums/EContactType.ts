import z from "zod";

export enum CONTACT_TYPE {
    CUSTOMER = "CUSTOMER",
    PARTNER = "PARTNER",
    VENDOR = "VENDOR",
    QUALIFIED_LEAD = "QUALIFIED_LEAD",
}
export const ZCONTACT_TYPE = z.nativeEnum(CONTACT_TYPE);
