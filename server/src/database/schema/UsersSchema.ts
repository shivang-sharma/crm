import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import { IUsers } from "../model/IUsers";
import { ROLE } from "../enums/ERole";
import { config } from "@/config";

const usersSchema = new Schema<IUsers>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            text: true,
        },
        name: {
            fname: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
                index: true,
            },
            lname: {
                type: String,
                lowercase: true,
                trim: true,
                index: true,
            },
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        organisation: {
            type: Schema.Types.ObjectId,
            ref: "Organisation",
            index: true,
        },
        refreshToken: {
            type: String,
        },
        role: {
            type: String,
            enum: ROLE,
        },
    },
    {
        timestamps: true,
    }
);
usersSchema.virtual("fullName").get(function () {
    return this.name.fname + " " + this.name.lname;
});
usersSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

usersSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

usersSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fulName,
        },
        config.get("accessTokenSecret") || "secret",
        {
            expiresIn: config.get("accessTokenSecret"),
        }
    );
};
usersSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        config.get("refreshTokenSecret") || "secret",
        {
            expiresIn: config.get("refreshTokenExpiry"),
        }
    );
};

export const Users = mongoose.model<IUsers>("Users", usersSchema);
