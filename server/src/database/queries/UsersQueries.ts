import mongoose, { Schema } from "mongoose";
import { Users } from "../schema/UsersSchema";
import { ROLE } from "../enums/ERole";
import { IUsers } from "../model/IUsers";

export async function FindOneUserByUsernameOrEmail(
    username: string,
    email: string
) {
    const user = await Users.findOne({
        $or: [{ username }, { email }],
    });
    return user;
}

export async function CreateNewUser(
    name: { fname: string; lname: string | undefined },
    username: string,
    email: string,
    password: string
) {
    try {
        const user = new Users({
            email: email,
            name: name,
            username: username.toLowerCase(),
            password: password,
        });
        await user.validate();
        const result = await user.save();
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function FindOneUserById(id: string) {
    const user = await Users.findById(id).select("-password -refreshToken");
    return user;
}

export async function ExpireRefreshTokenById(id: string) {
    await Users.findByIdAndUpdate(
        {
            _id: id,
        },
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );
}

export async function FindUserByIdAndUpdateOrganisationAndRole(
    userId: string,
    organisation: mongoose.Types.ObjectId | null,
    role: ROLE | null
) {
    const user = await Users.findByIdAndUpdate(
        {
            _id: userId,
        },
        {
            $set: {
                role: role,
                organisation: organisation,
            },
        },
        {
            new: true,
            select: "-password -refreshToken",
        }
    );
    return user;
}
export async function FindUserByOrganisationIdAndUpdateOrganisationAndRole(
    organisationId: string,
    organisation: Schema.Types.ObjectId | null,
    role: ROLE | null
) {
    const updateResult = await Users.updateMany(
        {
            organisation: organisationId,
        },
        {
            $set: {
                role: role,
                organisation: organisation,
            },
        }
    );
    return updateResult;
}
export async function FindUserByIdAndUpdateRole(userId: string, role: ROLE) {
    const user = await Users.findByIdAndUpdate(
        {
            _id: userId,
        },
        {
            $set: {
                role: role,
            },
        },
        {
            new: true,
            select: "-password -refreshToken",
        }
    );
    return user;
}
export async function FindManyUsersByOrganisationId(
    organisationId: Schema.Types.ObjectId
) {
    const users = await Users.find({
        organisation: organisationId,
    }).select("-password -refreshToken");
    return users;
}
export async function FindManyUsersBy(
    organisationId: mongoose.Types.ObjectId,
    limit: number,
    page: number,
    email: string | undefined,
    username: string | undefined
) {
    const users = await Users.find(
        {
            $and: [
                {
                    organisation: organisationId,
                },
                {
                    $or: [
                        {
                            email: email,
                        },
                        {
                            $text: {
                                $search: username ? username : "",
                            },
                        },
                    ],
                },
            ],
        },
        {
            score: {
                $meta: "textScore",
            },
        }
    )
        .select("-password -refreshToken")
        .sort({
            score: {
                $meta: "textScore",
            },
        })
        .limit(limit)
        .skip((page - 1) * limit);
    return users;
}
export async function FindUserByIdAndUpdate(
    id: string,
    updateData: Partial<IUsers>
) {
    const updatedUser = await Users.findByIdAndUpdate(
        { _id: id },
        { $set: updateData },
        {
            new: true,
        }
    ).select("-password -refreshToken");
    return updatedUser;
}

export async function FindUserByIdAndDelete(userId: string) {
    const deletedUser = await Users.findByIdAndDelete(userId);
    return deletedUser;
}
