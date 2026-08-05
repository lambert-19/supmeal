const asyncHandler = require("../utils/asyncHandler");

function backendUrl() {
  return process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
}

const uploadImages = asyncHandler(async (req, res) => {
  const urls = (req.files || []).map((file) => `${backendUrl()}/uploads/${file.filename}`);
  res.status(201).json({ urls });
});

module.exports = { uploadImages };
