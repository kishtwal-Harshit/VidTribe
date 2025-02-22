import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiErrors} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description) throw new ApiErrors(400,"Name and description are required")
    
    const userId = req.user?._id

    if(!userId) throw new ApiErrors(500,"Something went wrong while fetching user id")
    
    const playlistCreated = await Playlist.create({
        name,
        description,
        owner: userId
    })

    if(!playlistCreated) throw new ApiErrors(500,"Something went wrong while creating the playlist")
    
    return res.status(200).
    json(new ApiResponse(200,{playlistCreated},"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId) throw new ApiErrors(400,"User id is required")
    
    const userPlaylists = await Playlist.find({"owner" : userId}).select("-owner")

    if(userPlaylists.length===0) throw new ApiErrors(400,"User has no playlists")
    
    return res.status(200).
    json(new ApiResponse(200,{userPlaylists},"Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId) throw new ApiErrors(400,"playlist id is required")
    
    const playlistFetched = await Playlist.findOne({_id : playlistId})

    if(!playlistFetched) throw new ApiErrors(400,"no playlist with this id found")

    return res.status(200).
    json(200,{playlistFetched},"playlist fetched successfully")
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId) throw new ApiErrors(400,"both playlist id and video id are required")
    
    const videoAdded = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {videos: videoId}
        },
        {
            new: true
        }
    )

    if(!videoAdded) throw new ApiErrors(500,"Something went wrong while adding video to playlist")
    
    return res.status(200).
    json(new ApiResponse(200,{videoAdded},"Video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId || !videoId) throw new ApiErrors(400,"Playlist id and video id are required")
    
    const videoDeleted = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {videos: videoId}
        },
        {
            new: true
        }
    )

    if(!videoDeleted) throw new ApiErrors(400,"Something went wrong while deleting video")

    return res.status(200).
    json(200,{videoDeleted},"video deleted successfully")

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId) throw new ApiErrors(400,"playlist id is required")

    const playListDeleted = await Playlist.findByIdAndDelete(playlistId)

    if(!playListDeleted) throw new ApiErrors(400,"no playlist with this id found")
    
    return res.status(200).
    json(new ApiResponse(200,{playListDeleted},"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId) throw new ApiErrors(400,"playlist id is required")
    if(!name || !description) throw new ApiErrors(400,"new name and description required")

    const playlistUpdated = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : {
                name,
                description,
            }
        },
        {
            new : true
        }
    )

    if(!playlistUpdated) throw new ApiErrors(500,"Something went wrong while updating playlist")
    
    return res.status(200).
    json(new ApiResponse(200,{playlistUpdated},"playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}