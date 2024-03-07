import { Users } from "../schema/UsersSchema";

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
    fname: string,
    lname: string,
    username: string,
    email: string,
    password: string
) {
    const user = await Users.create({
        email: email,
        name: {
            fname: fname,
            lname: lname,
        },
        username: username.toLowerCase(),
        password: password,
    });
    return user;
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
