// backend/config/wasabi.js
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.WASABI_ACCESS_KEY,
  secretAccessKey: process.env.WASABI_SECRET_KEY,
  region: process.env.WASABI_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com",
  s3ForcePathStyle: true,
});

module.exports = s3;
