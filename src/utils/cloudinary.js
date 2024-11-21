import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

// Configuration of cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null
        // upload it on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uloaded successfully
        // console.log("Response of cloudinary : ", response)
        fs.unlinkSync(localFilePath)
        return response

    }catch(err) {
        fs.unlinkSync(localFilePath)        // remove the locally saved temp files as upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}