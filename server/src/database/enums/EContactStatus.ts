import z from "zod";

export enum CONTACT_STATUS {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}
export const ZCONTACT_STATUS = z.nativeEnum(CONTACT_STATUS);
