import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"

const getPublicKey = (url)=>{
    const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : null;
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType="asc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if(!userId || !query || !sortBy) throw new ApiErrors(400,"user id , query and sortBy are required")
    
    /*--good for small dataset but we use our syatems memory by fetching and doing operations on videos!, better to do in database itself-
    let userVideos = await Video.find({"owner": userId})

    if(userVideos.length===0) throw new ApiErrors(401,"User with given id has not published any videos")

    if(query){
        userVideos = userVideos.filter((vid)=> vid.title.toLowerCase().includes(query.toLowerCase()) || vid.description.toLowerCase().includes(query.toLowerCase()))
    }

    userVideos.sort((vid1,vid2)=>((vid1[sortBy]-vid2[sortBy])*(sortType==="asc"?1:-1)))

    const skip = (page-1)*limit

    const paginatedVideos = userVideos.slice(skip,skip+limit)

    return res.status(200).
    json(new ApiResponse(200,{paginatedVideos},"Videos fetched sucessfully"))*/

    let searchQuery = {owner: userId}

    if(query){
        searchQuery = {
            ...searchQuery,
            $or: [
                {title: {$regex: query, $options: 'i'}},
                {description : {$regex: query, $options: 'i'}}
                
            ]
        }
    }

    const sortOptions = {}
    if(sortBy){
        sortOptions[sortBy]=sortType==="asc" ? 1 : -1
    }

    const skip = (page-1)*limit

    const userVideos = await Video.find(searchQuery)
    .skip(skip)
    .limit(limit)
    .sort(sortOptions)

    if(userVideos.length===0) throw new ApiErrors(401,"User with givem id has not published any videos")

    return res.status(200).
    json(new ApiResponse(200,{userVideos},"User videos found sucessfully"))


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description) throw new ApiErrors(400,"Title or Description not provided!")
    
    let videoPath = req.files?.videoFile[0]?.path

    let thumbnailPath = req.files?.thumbnail[0]?.path

    if(!videoPath || !thumbnailPath) throw new ApiErrors(400,"Invalid Video or Thumbnail path")

    const video = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!video || !thumbnail) throw new ApiErrors(501,"Something went wrong while uploading video or thumbnail on cloudinary")

    
    const videoCreated = await Video.create({

        videoFile: video,
        thumbnail,
        title,
        description,
        duration: video.duration,
        owner: req.user?._id
    })

    if(!videoCreated) throw new ApiErrors(501,"Something went wrong while adding in database")

    res.status(200).
    json(new ApiResponse(200,{videoCreated},"video published sucessfully!"))
 
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    const requiredVideo = await Video.findById(videoId).select("-owner -isPublished")

    if(!requiredVideo) throw new ApiErrors(400,"No video with this id found")
    
    res.status(200).
    json(new ApiResponse(200,{requiredVideo},"Video fetched sucessfully!"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description} = req.body

    const thumbnailPath = req.file?.path

    if(!videoId) throw new ApiErrors(400,"Video id is required")
    if(!thumbnailPath) throw new ApiErrors(400,"Thumbnail path not found")
    if(!title || !description) throw new ApiErrors(400,"Field(s) missing")
    
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!thumbnail) throw new ApiErrors(501,"Something went wrong while uploading thumbnail on cloudinary")

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,

        {
            title,
            description,
            thumbnail

        },
        {
            new: true
        }
    )

    
    if(!updatedVideo) throw new ApiErrors(501,"Something went wrong while updating the video")

    res.status(200).
    json(new ApiResponse(200,{updatedVideo},"Video updated sucessfully!"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId) throw new ApiErrors(400,"Video id is required")

    const toDelete = await Video.findById(videoId).select("videoFile thumbnail")

    if(!toDelete) throw new ApiErrors(400,"No video with this id found")
    
    const videoPublicKey = getPublicKey(toDelete.videoFile)
    const thumbnailPublicKey = getPublicKey(toDelete.thumbnail)

    const deletedVideoFromCloudinary = await deleteFromCloudinary(videoPublicKey)
    const deletedThumbnailFromCloudinary = await deleteFromCloudinary(thumbnailPublicKey)


    if(!deletedVideoFromCloudinary) throw new ApiErrors(501,"Something went wrong while deleting video from cloudinary")
    if(!deletedThumbnailFromCloudinary) throw new ApiErrors(501,"Something went wrong while deleting thumbnail from cloudinary")

    const deletedFromDatabase = await Video.findByIdAndDelete(videoId)

    if(!deletedFromDatabase) throw new ApiErrors(501,"Something went wrong while deleteing from database")
    
    return res.status(200).
    json(new ApiResponse(200,{deletedFromDatabase},"Video deleted successfully"))


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId) throw new ApiErrors(400,"Video id is required")
    const previousState = await Video.findById(videoId).select("isPublished")

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: 1-previousState.isPublished
            }
        },
        {
            new: true
        }
    )

    if(!video) throw new ApiErrors(400,"No video with this id found")
    
    return res.status(200).
    json(new ApiResponse(200,{},"publish status toggeled sucessfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}