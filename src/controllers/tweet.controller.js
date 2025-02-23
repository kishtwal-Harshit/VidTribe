import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const {content} = req.body

    if(!content) throw new ApiErrors(400,"Tweet body is required")

    const userId = req.user?._id

    const newTweet = await Tweet.create({
      body: content,
      owner: userId,
    })

    const tweetCreated = await Tweet.findById(newTweet._id)

    if(!tweetCreated) throw new ApiErrors(500,"Something went wrong while creating the tweet")

    return res.status(200)
    .json(new ApiResponse(200,{tweetCreated},"tweet created successfully!"))


})

const getUserTweets = asyncHandler(async (req, res) => {

    const userId = req.user?._id

    const userTweets = await Tweet.find({"owner" : userId}).select("-owner")

    if(userTweets.length===0) throw new ApiErrors(501,"Somethig went wrong while fetching tweets")

    res.status(200)
    .json(new ApiResponse(200,{userTweets},"User Tweets fetched successfully!"))
   

})

const updateTweet = asyncHandler(async (req, res) => {

    const {tweetId,newContent} = req.params

    if(!tweetId || !newContent) throw new ApiErrors(400,"No tweet with this id found!")

    const tweetToBeUpdated = await Tweet.findByIdAndUpdate(

      tweetId,
      {
        $set:{
          content: newContent
        }
      },
        {
          new: true
        }
    )

    res.status(200).
    json(new ApiResponse(200,{tweetToBeUpdated},"Tweet updated successfully!"))
})

const getTweetScore = asyncHandler(async (req, res) => {

  const userId = req.user?._id

  const userTweets = await Tweet.find({"owner" : userId}).select("-owner")

  const numOfTweets = userTweets.length

  res.status(200).
  json(new ApiResponse(200,{numOfTweets},"These many tweets of the user"))
})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params

    if(!tweetId) throw new ApiErrors(400,"Tweet id required!")

    const tweetToBeDeleted = await Tweet.findByIdAndDelete(tweetId)

    if(!tweetToBeDeleted) throw new ApiErrors(404,"No tweet with this id found")

    res.status(200).
    json(new ApiResponse(200,{},"tweet deleted successfully!"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    getTweetScore,
    deleteTweet
}