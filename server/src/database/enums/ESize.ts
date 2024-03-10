import z from "zod";

export enum SIZE {
    MICRO = "MICRO",
    SMALL = "SMALL",
    MID = "MID",
    LARGE = "LARGE",
}
export const ZSIZE = z.nativeEnum(SIZE);
