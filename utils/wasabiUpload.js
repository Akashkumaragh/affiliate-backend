// backend/utils/wasabiUpload.js
const s3 = require("../config/wasabi");

exports.uploadToWasabi = async (file) => {
  console.log('Uploading file to Wasabi:', file.name);
  const params = {
    Bucket: process.env.WASABI_BUCKET,
    Key: `${Date.now()}_${file.name}`,
    Body: file.data,
    ContentType: file.mimetype,
  };

  try {
    const result = await s3.upload(params).promise();
    console.log('File uploaded successfully. Location:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('Error uploading to Wasabi:', error);
    throw error;
  }
};