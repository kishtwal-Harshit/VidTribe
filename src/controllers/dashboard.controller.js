import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    let totalViews = await Video.aggregate([
        {
            $match:{
                owner: req.user?._id
            }
        },
        {
            $group:{
                _id:null,
                totalViews: {$sum: "$views"}
            }
        }
    ])

    let subscriberCount = await Subscription.countDocuments({channel : req.user?._id})

    let totalVideos = await Video.countDocuments({owner : req.user?._id})

    let videoIds = await Video.find({owner: req.user?._id}).select("_id")

    let totalVideoLikes = await Like.countDocuments({video : {$in : videoIds.map((vid)=>vid._id)}})

    let channelStats = [
        {"total views : " : totalViews},
        {"total subscribers : " : subscriberCount},
        {"total videos : " : totalVideos},
        {"total video likes : " : totalVideoLikes}
    ]

    return res.status(200).
    json(new ApiResponse(200,{channelStats},"channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const {channelId} = req.params

    if(!channelId) throw new ApiErrors(400,"channel id is required")
    
    const videosUploaded = await Video.find({owner: channelId}).select("-duration -isPublished -owner -views")

    if(videosUploaded.length===0) throw new ApiErrors(500,"something went wrong while fetching videos")

    return res.status(200).
    json(new ApiResponse(200,{videosUploaded},"videos fetched succcessfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }