import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

//   now this fn will give localfilepath andd now we can give this to cloudinary
  
  export const upload = multer({ storage, })