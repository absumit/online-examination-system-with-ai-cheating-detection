const express = require('express');
const router = express.Router();
const user = require("../models/user");
const hashing = require("../utils/hashpass");
const check = require("../utils/checkpass");
const inputvalidator = require("../utils/validators");
const jwt = require("jsonwebtoken");
const verifyToken = require('../middleware/verify');
const redisClient = require('../config/redis');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_TTL = '7d';

// Register Route - Students only
router.post('/register', async (req, res) => {
  try {
    // Validation
    inputvalidator(req.body);

    // Force role to 'student' for public registration - admins can only be created by existing admins
    req.body.role = 'student';

    // Converting password into hashing
    const hashed = await hashing(req.body.password);
    req.body.password = hashed;

    await user.create(req.body);
    res.status(201).json({ message: "User registered successfully", success: true });
  }
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists", success: false });
    }
    else {
      return res.status(400).json({ message: err.message, success: false });
    }
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.password;

    if (!email || !pass) {
      return res.status(400).json({ message: "Email and password are required", success: false });
    }

    const dbdata = await user.findOne({ email });
    if (!dbdata) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    const dbpass = dbdata.password;
    const valid = await check(pass, dbpass);
    if (!valid) throw new Error("Invalid password");

    // Sending cookie
    const token = jwt.sign({ email: dbdata.email }, process.env.JWT_KEY, { expiresIn: TOKEN_TTL });
    res.cookie("token", token, { ...COOKIE_OPTIONS, maxAge: TOKEN_TTL_MS });

    res.json({
      message: "Login successful",
      success: true,
      user: {
        id: dbdata._id,
        email: dbdata.email,
        role: dbdata.role,
        name: dbdata.name
      }
    });
  }
  catch (err) {
    res.status(400).json({ message: err.message || "Login failed", success: false });
  }
});

// Current User Route (based on cookie token)
router.get('/me', verifyToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
    },
  });
});

// Logout Route
router.get('/logout',verifyToken,async (req, res) => {
      
  try{
       
     const token = req.cookies.token;

     const payload = jwt.decode(token);

     await redisClient.set(`token:${token}`,"blocked");

     const exp = payload?.exp;
     if (typeof exp === 'number') {
       const ttl = Math.floor(exp - Date.now() / 1000);
       if (ttl > 0) {
         await redisClient.expire(`token:${token}`, ttl);
       }
     } else {
       await redisClient.pexpire(`token:${token}`, TOKEN_TTL_MS);
     }

     res.clearCookie("token", COOKIE_OPTIONS);

     res.status(200).json({message: "Logged out successfully"})

  }
  catch(err)
  {
      res.status(500).json({message: "Error: " + err.message})
  }
    

});

module.exports = router;
