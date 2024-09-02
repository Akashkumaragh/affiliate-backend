const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");

exports.adminSignup = async (req, res) => {
  try {
    const { firstname, lastname, email, mobile, password, confirmpassword } =
      req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !mobile ||
      !password ||
      !confirmpassword
    ) {
      return res.status(200).json({
        success: false,
        message: "Please fill all the details properly",
      });
    }
    if (password !== confirmpassword) {
      return res.status(200).json({
        success: false,
        message: "The password and confirm password is not matching",
      });
    }

    const checkUserPresent = await Admin.findOne({}).count();
    if (checkUserPresent.length > 0) {
      return res.status(404).json({
        success: false,
        message:
          "Sorry only one admin can Exists.You will not be able to Signup",
      });
    }
    const existingUser = await Admin.findOne({
      $or: [{ email: email }, { mobile: mobile }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(200).json({
          success: false,
          message: "Sorry, the email is already in use",
        });
      }
      if (existingUser.mobile === mobile) {
        return res.status(200).json({
          success: false,
          message: "Sorry, the mobile number is already in use",
        });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({
      firstname,
      lastname,
      email,
      mobile,
      password: hashedPassword,
    });
    return res.status(200).json({
      success: true,
      message: "The Admin has been registered successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(404).json({
      success: false,
      message: "Sorry something went wrong while student signup",
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(200).json({
        success: false,
        message: "Sorry Please enter all the details properly",
      });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: false,
        message: "Sorry the admin is not even registered",
      });
    }
    if (await bcrypt.compare(password, admin.password)) {
      const token = jwt.sign(
        {
          email: admin.email,
          id: admin._id,
          accountType: "Admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: "200m" }
      );
      admin.password = undefined;
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
      };
      return res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        admin,
        message: "User login success",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (e) {
    return res.status(404).json({
      success: false,
      message: "Sorry something went wrong while allowing the student",
    });
  }
};

//over here we can write for the links as well
exports.approveUserRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    const passwordSetUrl = `${process.env.FRONTEND_URL}/set-password/${resetPasswordToken}`;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        agentApprovalStatus: "Approved",
        resetPasswordToken: resetPasswordToken,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Send approval email with password set link
    const emailSubject = "Your Account has been Approved by AGH";
    const emailBody = `
        Congratulations! Your account has been approved.
        Please set your password using the following link:
        ${passwordSetUrl}
      `;
    await mailSender(user.email, emailSubject, emailBody);

    return res.status(200).json({
      success: true,
      message: "User approved successfully",
    });
  } catch (error) {
    console.log("Error occurred while approving user account", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.declineUserRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Update user status
    const user = await User.findByIdAndUpdate(userId, {
      approvalStatus: "Declined",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Send decline email
    const emailSubject = "Your Account Request has been Declined by AGH";
    const emailBody = `We regret to inform you that your account request has been declined because ${
      reason || "undefined"
    } `;
    await mailSender(user.email, emailSubject, emailBody);

    return res.status(200).json({
      success: true,
      message: "User request declined successfully",
    });
  } catch (error) {
    console.log("Error occurred while declining user account request", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/* api/admin/users?page=2&limit=15&status=Approved */
exports.getUsers = async (req, res) => {
  try {
    console.log("req.query", req.query);
    const page = parseInt(req.query.page, 10) || 1;
    console.log("page", page);
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status;

    const queryObject = {};
    if (status) {
      queryObject.agentApprovalStatus = status;
    }

    const agents = await User.find(queryObject)
      .select("-password -refreshToken")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(queryObject);

    return res.status(200).json({
      success: true,
      count: agents.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users: agents,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching agents",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    console.log("user data", user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User Found Successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error while fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user",
      error: error.message,
    });
  }
};
