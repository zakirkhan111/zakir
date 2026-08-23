const AppError = require('../utils/AppError');

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

async function uploadToImgBB(file) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new AppError('Image uploads are not configured. Please contact support.', 503);

  const form = new FormData();
  form.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

  let response;
  try {
    response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(apiKey)}`, { method: 'POST', body: form });
  } catch (err) {
    throw new AppError('Image upload service is unavailable. Please try again.', 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new AppError('Image upload service returned an invalid response.', 502);
  }
  if (!response.ok || !payload?.success || !payload?.data?.url) {
    throw new AppError(payload?.error?.message || 'Image upload failed. Please try again.', 502);
  }
  return payload.data.url;
}

module.exports = { uploadToImgBB };
