import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // access token and refresh token user ko dena and hai refresh token ko db me rakhna hai
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath); // if cover image is absent it will atomatically return "" string

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  //   now store user object
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // console.log("User object : ", user)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // after storing pass, refreshToken nhi aana chahiye respose me
  ); // if user object ka id mil gya means user create ho gya

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  // now send respose
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body se data lao
  // username or email pr login karwao
  // find user in db
  // if exist check pass
  // if pass is correct then generate access and refresh token
  // send these tokens into cookies
  // then send response ook

  const { email, username, password } = req.body;
  console.log(email);
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    // user not exist
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPassowrdCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user password");
  }

  // now password is also correct
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // yet my user has no object accesstoken, refreshtoken coz i hv added it currently so make one call to db again
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // now it has token except pass and refreshtoken

  // send these token in cookies, first design options of cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true, // it will return new updated user
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unautjorized request");
  }

  try {
    
    // convert the incoming token in decoded form
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    // now this decodedToken must have _id coz we had given at time of creation
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
    // now compare the stored and incoming token
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
  // now if valid then generate and refresh
    const options = {
      httpOnly: true,
      secure: true
    }
    const {accessToken, newrefreshToken} = await  generateAccessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newrefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
    
  }
});

const changeCurrentPassword = asyncHandler( async(req, res) =>{
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPassowrdCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler( async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
  const {fullName, email} = req.body
  if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "avatar is updated successfully"))

})

const updateUserCoverImage = asyncHandler( async(req, res) => {
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "cover Image is missing")
  }
  const coverIamge = uploadOnCloudinary(coverImageLocalPath)
  if(!coverIamge.url){
    throw new ApiError(400, "Error while uploading file on cloudinary")
  }

  const user = await User.findByIdAndUpdate(req.user?._id, 
      {
        $set: {
          coverImage: coverIamge.url
        }
      },
      {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "coverImage updated successfully"))

})

const getUserChannelProfile = asyncHandler( async(req, res) => {
  // get the username from url to redirect the user to his channel
  const {username} = req.params 
  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {$size: "$subscribers"},
      channelsSubscribedToCount: {$size: "$subscribedTo"},
      isSubscribed: {
        $cond: {if: {$in: [req.user?._id, "$subscribers.subscriber"]}},
        then: true,
        else: false
      }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed:  1,
        avatar: 1,
        coverIamge: 1,
        email: 1
      }
    }
  ])

  if(!channel?.length) {
    throw new ApiError(404, "channel does not exist")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "wathchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetch successfully"))
})

export { 
  registerUser,
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
