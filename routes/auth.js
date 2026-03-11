const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { dbGet, dbRun } = require("../db");

const router = express.Router();

router.post(
  "/register",
  [
    body("username").trim().notEmpty().withMessage("Username is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    try {
      const existingEmail = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
      if (existingEmail) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const existingUsername = await dbGet("SELECT id FROM users WHERE username = ?", [username]);
      if (existingUsername) {
        return res.status(409).json({ error: "This username is already taken." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      const allowedRoles = ["user", "admin"];
      const userRole = allowedRoles.includes(role) ? role : "user";

      await dbRun(
        "INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
        [userId, username, email, hashedPassword, userRole]
      );

      const token = jwt.sign(
        { id: userId, username, email, role: userRole },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(201).json({ message: "Account created successfully.", token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(200).json({ message: "Logged in successfully.", token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }
);

module.exports = router;
