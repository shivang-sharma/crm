import z from "zod";

export enum STAGE {
    NEW,
    DISCOVERY,
    PROPOSAL,
    NEGOTIATION,
    WON,
    LOST,
}
export const ZSTAGE = z.nativeEnum(STAGE);
