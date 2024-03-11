import z from "zod";

export enum STAGE {
    NEW = "NEW",
    DISCOVERY = "DISCOVERY",
    PROPOSAL = "PROPOSAL",
    NEGOTIATION = "NEGOTIATION",
    WON = "WON",
    LOST = "LOST",
}
export const ZSTAGE = z.nativeEnum(STAGE);
