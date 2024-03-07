import { IUsers } from "@/database";
import type { Request } from "express";
export interface CustomRequest extends Request {
    user?: IUsers;
}
