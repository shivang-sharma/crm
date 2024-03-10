import z from "zod";

export enum PRIORITY {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
}
export const ZPRIORITY = z.nativeEnum(PRIORITY);
