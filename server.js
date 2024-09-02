const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const userRoutes = require("./routes/user.route");
const adminRoutes = require("./routes/admin.route.js");
const { connectToDB } = require("./config/database");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

app.use(express.json());
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, //5mb
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
connectToDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
