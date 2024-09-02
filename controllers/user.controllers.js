// backend/controllers/userController.js
const User = require("../models/user.model");
const { uploadToWasabi } = require("../utils/wasabiUpload");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/mailSender");
const OTP = require("../models/otp.model");

// Affiliate User Register

exports.userSignup = async (req, res) => {
  try {
    const { firstname, lastname, email, countryCode, mobile, occupation, otp } =
      req.body;
    if (
      !firstname ||
      !lastname ||
      !email ||
      !countryCode ||
      !mobile ||
      !occupation ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the details properly",
      });
    }

    if (!req.files || !req.files.document) {
      console.error("No document file received");
      return res.status(400).json({ message: "No document uploaded" });
    }
    //check Is User Already Present
    const isUserAlreadyPresent = await User.findOne({
      $or: [{ email }, { mobile: Number(mobile) }],
    });

    if (isUserAlreadyPresent) {
      return res.status(400).json({
        success: false,
        message: "Account already exist with mobile number or email",
      });
    }

    const dbOtp = await OTP.find({
      email: email,
    })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log("dbOtp", dbOtp);
    if (dbOtp.length == 0) {
      return res.status(404).json({
        success: false,
        message: "Could'nt find otp",
      });
    }
    if (dbOtp[0].otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid otp",
      });
    }

    const document = req.files.document;
    console.log("Document details:", document);

    // Upload document to Wasabi
    let documentUrl;
    try {
      documentUrl = await uploadToWasabi(document);
    } catch (uploadError) {
      return res.status(500).json({
        message: "Error uploading document",
        error: uploadError.message,
      });
    }

    await User.create({
      firstname,
      lastname,
      email,
      countryCode,
      mobileNumber: Number(mobile),
      occupation,
      documentUrl,
    });
    return res.status(201).json({
      success: true,
      message: "Your account created successfully",
    });
  } catch (e) {
    console.log("Error while user signup", e);
    return res.status(500).json({
      success: false,
      message: "Sorry something went wrong while Agent signup",
    });
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    console.log("user login");
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "fill all required fields",
      });
    }

    const user = await User.findOne({ email });
    console.log("user", user);
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (user.approvalStatus !== "Approved") {
      return res.status(403).json({
        success: false,
        message: `Account approval is ${user.approvalStatus}`,
      });
    }

    if (!user.password) {
      return res
        .status(403)
        .json({ message: "Password not set for your Account" });
    }

    // Compare the password with the hashed password in the database
    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    user.password = undefined;
    user.refreshToken = undefined;

    // Generate a JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expiration time
    );

    // Respond with the token
    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: true,
      message: "Server error",
    });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token: resetPasswordToken } = req.params;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation do not match.",
      });
    }

    const user = await User.findOne({
      token: resetPasswordToken,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link.",
      });
    }

    if (
      user.resetPasswordExpires &&
      user.resetPasswordExpires.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Password reset link has expired.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.token = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset.",
    });
  } catch (error) {
    console.error("Error while setting password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

// generate reset password link
// user not able to generate reset password link if his account not approved by admin.
// when user forget their password.
exports.generateResetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    // Check if the user's approval status is not "Approved"
    if (user.approvalStatus !== "Approved") {
      return res.status(403).json({
        success: false,
        message: `Account approval status is '${user.approvalStatus}'.`,
      });
    }

    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    // Update user with the token and expiration
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const passwordSetUrl = `${process.env.FRONTEND_URL}/set-password/${resetPasswordToken}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      `You requested a password reset. Please set your new password by clicking on the following link: ${passwordSetUrl}. This link is valid for 1 hour.`
    );

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error(
      "Error while generating reset password link for user:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Details found",
      user: user,
    });
  } catch (error) {
    console.log("Error while getting user profile", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Assuming you have user info in req.user from authentication middleware

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current password and new password are required",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the current password is correct
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePassword controller:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing the password",
    });
  }
};
