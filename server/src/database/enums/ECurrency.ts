import z from "zod";

export enum CURRENCY {
    USD = "USD",
    INR = "INR",
}
export const ZCURRENCY = z.nativeEnum(CURRENCY);
