import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema(
    {
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,   // cloudnary url will be used (it give url of stored image we can store url only)
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
},
{
    timestamps: true
}
)

// middleware
// using a pre hook of mongoose so that whenever data is going to save first it will go thru this pre middleware which encrypt it
// do this before save
userSchema.pre("save", async function (next) {
    if(!this.isModified("password"))  return next()     // means if password is not modified then return without doing anything
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// add custom method in methods object of userSchema
userSchema.methods.isPassowrdCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)                    // this.password is encrypted data, it will return true or false
}

// inject more method into userSchema to generate access token and refresh token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {           // payload
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {           // less payload in refresh token
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)