import mongoose, { Document } from "mongoose";
import { ROLE } from "../enums/ERole";

export interface IUsers extends Document {
    username: string;
    name: {
        fname: string;
        lname: string;
    };
    email: string;
    password: string;
    organisation: mongoose.Schema.Types.ObjectId;
    refreshToken: string;
    role: ROLE;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}
