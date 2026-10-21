import multer from 'multer';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';



const TWO_MB = 2 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: TWO_MB},
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith("image/")){
            cb(null, true)
        }else {
            cb(new ApiError(httpStatus.BAD_REQUEST, "Only image files are allowed"))
        }
    }
});

export default upload;


