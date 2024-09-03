const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: { type: String, required: true },
    password: {
      type: String,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    mobileNumber: {
      type: Number,
      required: true,
    },
    occupation: {
      type: String,
      required: true,
    },
    document: {
      id: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true },
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },
    accountType: {
      type: String,
      enum: ["User"],
      default: "User",
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
