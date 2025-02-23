import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!videoId) throw new ApiErrors(400,"video id is required")
    
    const isLiked = await Like.findOne({video: videoId, likedBy: req.user?._id})

    if(isLiked){
        const disliked = await Like.findOneAndDelete({video: videoId, likedBy: req.user?._id})
        if(!disliked) throw new ApiErrors(500,"Something went wrong while disliking the video")
    }
else{
        const liked = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        if(!liked) throw new ApiErrors(500,"Something went wrong while liking the video")
    }

    return res.status(200).
    json(new ApiResponse(200,{},(isLiked ? "disliked successfully" : "liked successfully")))
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId) throw new ApiErrors(400,"comment id is required")

    const isLiked = await Like.findOne({comment: commentId, likedBy: req.user?._id})

    if(isLiked){
        const disliked = await Like.findOneAndDelete({comment: commentId, likedBy: req.user?._id})
        if(!disliked) throw new ApiErrors(500,"something went wrong while disliking")
    }
    else{
        const liked = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        if(!liked) throw new ApiErrors(500,"something went wrong while liking")
    }

    return res.status(200).
    json(new ApiResponse(200,{},(isLiked ? "disliked successfully" : "liked successfully")))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!tweetId) throw new ApiErrors(400,"tweet id is required")

        const isLiked = await Like.findOne({tweet: tweetId, likedBy: req.user?._id})
    
        if(isLiked){
            const disliked = await Like.findOneAndDelete({tweet: tweetId, likedBy: req.user?._id})
            if(!disliked) throw new ApiErrors(500,"something went wrong while disliking")
        }
        else{
            const liked = await Like.create({
                tweet: tweetId,
                likedBy: req.user?._id
            })
            if(!liked) throw new ApiErrors(500,"something went wrong while liking")
        }
    
        return res.status(200).
        json(new ApiResponse(200,{},(isLiked ? "disliked successfully" : "liked successfully")))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const likedVideos = await Like.find({likedBy: req.user?._id}).select("video")

    if(likedVideos.length===0) throw new ApiErrors(400,"user has not liked any videos")

    const likedVideoInfo = await Video.find({_id : {$in: likedVideos.map((vid)=>vid.video)}}).select("_id views owner")

    if(likedVideoInfo.length===0) throw new ApiErrors(500,"something went wrong while fetching liked video's information")

    return res.status(200).
    json(new ApiResponse(200,{likedVideoInfo},"liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}