const express = require("express");
const {
  adminSignup,
  adminLogin,
  approveUserRequest,
  declineUserRequest,
  getUsers,
  getUserById,
} = require("../controllers/admin.controllers");

const router = express.Router();

// Note:- add authentication middlewares letter => auth and isAdmin

router.post("/login", adminLogin);
router.post("/signup", adminSignup);

router.put(`/users/:userId/approved`, approveUserRequest);

router.put(`/users/:userId/declined`, declineUserRequest);
router.get("/users", getUsers);
router.get("/users/:userId", getUserById);

module.exports = router;
