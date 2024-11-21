import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation
  // check if user already exist: username, email
  // check for images, check for avatar if available then upload it to cloudinary
  // check by cloudinary also whether avatar is uploaded or not Coz it is required field
  // create user object
  // then create entry in db
  // remove pass and refresh token field from respose
  // check if user created successfully
  // if successful then return result otherwie failed

  const { fullName, email, username, password } = req.body;
  // console.log("email: ", email, "\n", "pass : ", password);

  if (
    [fullName, email, username, password].some(
      (field) => field?.trim() === "" // it will return true or false if empty
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // console.log("request.files : ",req.files)
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;          // if user will not upload it will return undefined

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)        // if cover image is absent it will atomatically return "" string

  if(!avatar){
    throw new ApiError(400, "Avatar is required")
  }

//   now store user object
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()  
})

// console.log("User object : ", user)
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"           // after storing pass, refreshToken nhi aana chahiye respose me
)     // if user object ka id mil gya means user create ho gya

if(!createdUser) {   
    throw new ApiError(500, "Something went wrong while registering the user")
}
// now send respose
return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully!")
)

});

export { registerUser };
