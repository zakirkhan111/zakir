const multer = require('multer');
const AppError = require('../utils/AppError');
const { uploadToImgBB } = require('../config/imgbb');

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Only JPG, PNG, and WEBP images are allowed.', 400), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits });
const uploadImages = (multerHandler) => (req, res, next) => {
  multerHandler(req, res, async (err) => {
    if (err) return next(err instanceof multer.MulterError ? new AppError(err.message, 400) : err);
    try {
      if (req.file) req.file.path = await uploadToImgBB(req.file);
      if (req.files?.length) await Promise.all(req.files.map(async (file) => { file.path = await uploadToImgBB(file); }));
      next();
    } catch (uploadError) { next(uploadError); }
  });
};
const uploadProfilePicture = uploadImages(upload.single('profilePicture'));
const uploadProjectImage = uploadImages(upload.single('projectImage'));
const uploadTaskAttachment = uploadImages(upload.single('attachment'));
const uploadCompletionEvidence = uploadImages(upload.array('evidence', 5));

module.exports = {
  uploadProfilePicture,
  uploadProjectImage,
  uploadTaskAttachment,
  uploadCompletionEvidence,
};
