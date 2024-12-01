import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

// here, req has cookies because we are using cookie middleware
// agar accessToken cookies me hai ya fir user koi (Authorization)header bheja hai vo hoga
export const verifyJWT = asyncHandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        // agar token hai tb check kro whether token(it should have what u hv sended at the time of creation of token) is correct or not
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)          // jwt will automaticall verify it
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
    
        if(!user){      // if user not exist means ur token is wrong
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // now, user hai tb (means token is crt)
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Inavlid refresh token")
        
    }
})