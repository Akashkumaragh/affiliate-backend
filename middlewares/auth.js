const jwt = require("jsonwebtoken");
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token is missing",
      });
    }
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (e) {
      return res.status(404).json({
        success: false,
        message: "Token is invalid",
      });
    }
    next();
  } catch (e) {
    return res.status(404).json({
      success: false,
      message: "Sorry something went wrong while validating the token",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(404).json({
        success: false,
        message: "This is the protected route for Admin",
      });
    }
    next();
  } catch (e) {
    return res.status(404).json({
      success: false,
      message: "User cannot be verified something went wrong",
    });
  }
};
