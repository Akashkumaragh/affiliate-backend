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
    mobile: {
      type: Number,
      required: true,
    },
    occupation: {
      type: String,
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },
    accountType: {
     type:String,
     enum:["User"],
     default:"User"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
