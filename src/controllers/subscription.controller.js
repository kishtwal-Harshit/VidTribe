import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId) throw new ApiErrors(400,"Channel id is required")
        
    const isSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })

    if(isSubscriber){
        const subscriberDeleted = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user?._id
        })

        if(!subscriberDeleted) throw new ApiErrors(501,"Something went wrong while unsubscribing")
    }
    
    else{
        const newSubscriberAdded = await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id
        })
        if(!newSubscriberAdded) throw new ApiErrors(501,"Something went wrong while subscribing")

    }


    res.status(200).
    json(new ApiResponse(200,{},(isSubscriber ? "Unsubscribed sucessfully" : "Subscribed sucessfully")))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId) throw new ApiErrors(400,"Channel id is required")

    const channelSubscribers = await Subscription.find({channel: channelId}).select("subscriber")

    if(channelSubscribers.length===0) throw new ApiErrors(401,"No channel with this id exists")
    
    const subscriberDetails = await User.find({
        _id: {$in : channelSubscribers}
    }).select("_id username email")

    if(subscriberDetails.length===0) throw new ApiErrors(501,"Something went wrong while fetching detais of subscribers")

    return res.status(200).
    json(new ApiResponse(200,{subscriberDetails},"Subscriber list fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId) throw new ApiErrors(400,"Subscriber id is required")
    
    const channelsSubscribed = await Subscription.find({subscriber: subscriberId}).select("channel")

    if(channelsSubscribed.length===0) throw new ApiErrors(400,"User is not subscribed to any channel")
    
    const channelDetails = await User.find({
        _id: {$in: channelsSubscribed}
    }).selectedExclusively("_id username email")

    if(channelDetails.length===0) throw new ApiErrors(500,"Something went wrong while fetching channel details")
    
    return res.status(200).
    json(200,new ApiResponse(200,{channelDetails},"Channel details fetched sucessfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}