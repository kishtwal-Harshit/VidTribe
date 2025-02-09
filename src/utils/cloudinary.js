import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const uploadOnCloudinary = async (localFilePath)=>{

  try{
    if(!localFilePath) return null
    //upload on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,{
      resourse_type: "auto"
    })
    console.log('file is uploades on cloudinary!',response.url)
    return response
  } catch(err){
      fs.unlinkSync(localFilePath)//remove the locally saved temporary file as upload operstion is failed
      return null
  }
}
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET  
        
});

export {uploadOnCloudinary}
