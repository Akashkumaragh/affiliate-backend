// backend/utils/wasabiUpload.js
const s3 = require("../config/wasabi");
require("dotenv").config();
function generateSignedUrl(fileId) {
  const params = {
    Bucket: process.env.WASABI_BUCKET,
    Key: `documents/${fileId}`,
    Expires: 60 * 60, // URL valid for 1 hour
  };

  return s3.getSignedUrl("getObject", params);
}

exports.uploadToWasabi = async (file, fileId) => {
  console.log("Uploading file to Wasabi:", file.name);
  const params = {
    Bucket: process.env.WASABI_BUCKET,
    Key: `documents/${fileId}`,
    Body: file.data,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  try {
    await s3.upload(params).promise();
    const signedUrl = await generateSignedUrl(fileId);
    console.log("File uploaded successfully. Location:", signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("Error uploading to Wasabi:", error);
    throw error;
  }
};
