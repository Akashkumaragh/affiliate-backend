// backend/routes/userRoutes.js
const express = require("express");
const {
  userLogin,
  userSignup,
  setPassword,
  getProfile,
  generateResetPasswordLink,
  changePassword,
} = require("../controllers/user.controllers");
const {auth} = require("../middlewares/auth")

const router = express.Router();

router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/set-password/:token", setPassword);
router.get("/profile", getProfile);
router.post("/forget-password", generateResetPasswordLink);
router.post("/change-password", auth, changePassword);

module.exports = router;
