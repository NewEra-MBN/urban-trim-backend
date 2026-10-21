import { v2 as cloudinary } from "cloudinary";
import httpStatus from "http-status";
import config from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";


cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
});


const uploadImage = async (file: Express.Multer.File, folder: string) => {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    console.log(dataUri)
    try{
        const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            resource_type: "image"
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        }
    } catch(err: any) {
        console.log(err)
        const statusCode = err?.http_code === 400 ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
        throw new ApiError(statusCode, err?.message ?? "Image upload failed")
    }
}


const deleteImage = async (publicId: string) => {
    await cloudinary.uploader.destroy(publicId)
}



export default { uploadImage, deleteImage}