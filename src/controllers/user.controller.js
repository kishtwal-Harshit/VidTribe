import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiErrors(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiErrors(409, "User with this email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const userCreated = await User.findById(user._id).select("-password -refreshToken");

  if (!userCreated) {
    throw new ApiErrors(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiErrors(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiErrors(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    //maxAge: 24 * 60 * 60 * 1000,
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
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //since we dont have user here, use auth.middleware
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async(req,res)=>{

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  try{
    if(!incomingRefreshToken) throw new ApiErrors(401,"Unauthorized request")

      const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
      const user = await User.findById(decodedToken?._id)
    
      if(!user) throw new ApiErrors(401,"Invalid Refresh Token")
       
      if(incomingRefreshToken!==user?.refreshToken) throw new ApiErrors(401,"Refresh Token is expired or used")
    
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV=="development"
      }
    
      const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)
    
      return res.status(200).cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(new ApiResponse(200,{},"Access Token Refreshed Succesfully!"))
  }
  catch(err){
    throw new ApiErrors(401,err?.message || "Invalid refresh Token")
  }
  
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

  const {oldPassword,newPassword} = req.body //coz sent by user

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect =  user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) throw new ApiErrors(401,"incorrect password!")

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiResponse(200,{},"password changed sucessfully!"))
  

})

const updateAccountDetails = asyncHandler(async(req,res)=>{

  const {fullName,email} = req.body

  if(!fullname || !email) throw new ApiErrors(401,"fullName and email is required!")

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName:fullName,
        email:email
      }
    },
    {
      new: true
    }
  )

  return res.status(200)
  .json(new ApiResponse(200,user,"Account successfully updated"))



})

const getCurrentUser = asyncHandler(async (req,res)=>{

  //const currentUser = await User.findById(req.user?._id)
  //const currentUserName = currentUser?.username

  //console.log(currentUserName)

  return res.status(200)
  .json(new ApiResponse(200,req.user._id,"current user fetched sucessfully!"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

  //here we work with files
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath) throw new ApiErrors(400,"Avatar file is missing")

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) throw new ApiErrors(400,"Error while uploading avatar")

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
      {
        new : true
      }
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,{},"avatar updated sucessfully!"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{

  //here we work with files
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath) throw new ApiErrors(400,"Avatar file is missing")

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url) throw new ApiErrors(400,"Error while uploading avatar")

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
      {
        new : true
      }
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,{},"cover image updated sucessfully!"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   
    const {username} = req.params

    if(!username?.trim) throw new ApiErrors(400,"user name is missing")

    const channel = await User.aggregate([

      {
        $match:{
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
          subscribersCount:{
            $size: "$subscribers"
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo"
          },
          isSubscribed: {
            $cond: {
              if: {$in: [req.user?._id,"$subscribers.subscriber"]},
              then: true,
              else : false
            }
          }
        }
      },
      {
        $project: {
          fullname: 1,
          userName: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1
        }
      }

    ])

    if(!channel?.length) throw new ApiErrors(404,"channel does not exist")

    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched sucessfully!")) 
})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id) //id fetched from middleware
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as:"owner",
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
              $addFields:{
                owner: {
                  $first: "$owner"
                }
              }
            }
          ]
        }
      }
    ])

    return res.status(200)
              .json(new ApiResponse(200,user[0].watchHistory,"Watch History fetced sucefffully!"))
})

const deleteAccount = asyncHandler(async(req,res)=>{

   const user = await User.findById(req.user?._id)
   const userName = user?.username
   const userToBeDeleted = await User.aggregate([
    {
      $match: {
        username: userName
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
    }
   ])

   const subscribers = userToBeDeleted[0]?.subscribers || []

   const subscriberIds = subscribers.map((sub)=>sub._id)

   const channels = userToBeDeleted[0]?.channels || []

   const channelIds = channels.map((channel)=>channel._id)


   await Subscription.deleteMany({
    _id: {$in : subscriberIds}
   })
   
   await Subscription.deleteMany({
      _id: {$in: channelIds}
  })

   
   const videosToBeDeleted = await User.aggregate([

      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "userVideos"
        }
      }
   ])

   const videos = videosToBeDeleted[0]?.userVideos || [];

   const videoIds = videos.map((vid)=>vid?._id)

   await Video.deleteMany({
    _id : {$in : videoIds}
   })

   await User.deleteOne({
    username: userName
   })

   return res.status(200)
   .json(new ApiResponse(200,{},"account deleted sucessfully"))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, getCurrentUser, updateUserAvatar, updateUserCoverImage,getUserChannelProfile, getWatchHistory, deleteAccount };