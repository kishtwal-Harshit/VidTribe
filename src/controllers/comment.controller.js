import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId) throw new ApiErrors(400,"video id is required")

    const comments = await Comment.find({video : videoId})
                     .skip((page-1)*limit)
                     .limit(limit)
                     .select("content")

    if(comments.length===0) throw new ApiErrors(400,"no video with this id found")
    
    return res.status(200).
    json(new ApiResponse(200,{comments},"comments fetched successfully"))


})

const addComment = asyncHandler(async (req, res) => {


    const {videoId} = req.params
    const {content} = req.body

    if(!videoId) throw new ApiErrors(400,"video id is required")
    if(!content) throw new ApiErrors(400,"comment content is required")

    const commentAdded = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if(!commentAdded) throw new ApiErrors(500,"somwthing went wrong while adding the comment")

    return res.status(200).
    json(new ApiResponse(200,{commentAdded},"comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params
    const {content} = req.body

    if(!commentId) throw new ApiErrors(400,"video id is required")
    if(!content) throw new ApiErrors(400,"comment content is required")

    const commentUpdated = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        }
    )

    if(!commentUpdated) throw new ApiErrors(400,"something went wrong while updating the comment")
    
    return res.status(200).
    json(new ApiResponse(200,{commentUpdated},"comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    

    const {commentId} = req.params

    if(!commentId) throw new ApiErrors(400,"comment id is required")

    const commentDeleted = await Comment.findByIdAndDelete(commentId)

    if(!commentDeleted) throw new ApiErrors(500,"something went wrong while deleting the comment")

    return res.status(200).
    json(new ApiResponse(200,{commentDeleted},"comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }