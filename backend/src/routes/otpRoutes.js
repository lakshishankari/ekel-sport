const express = require("express");
const { sendOtp, verifyOtp } = require("../otpController");

const router = express.Router();

// purpose = REGISTER or RESET_PASSWORD
router.post("/send", sendOtp);
router.post("/verify", verifyOtp);

module.exports = router;
