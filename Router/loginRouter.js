const express = require("express");

const router = express.Router();


router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.user = { username, role: "admin" };

    
    return req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Could not save session",
        });
      }
      res.json({
        success: true,
        message: "Login successful",
        user: req.session.user,
      });
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});


router.get("/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Please log in" });
  }
  res.json({ success: true, user: req.session.user });
});


router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.clearCookie("rizz_session");
    return res.json({ success: true, message: "Logged out successfully" });
  });
});

module.exports = router;