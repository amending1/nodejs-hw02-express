const express = require("express");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User, validateSignup, validateLogin } = require("./users-service.js");

router.post("/signup", async (req, res) => {
  // Walidacja danych wejściowych
  const { error } = validateSignup(req.body);
  if (error) {
    return res.status(400).json(error.message);
  }

  try {
    const { email, password } = req.body;
    // Sprawdzam, czy email jest już używany
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    // Haszowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tworzenie nowego użytkownika
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  // Walidacja danych wejściowych
  const { error } = validateLogin(req.body);
  if (error) {
    return res.status(400).json(error.message);
  }

  try {
    const { email, password } = req.body;
    // Wyszukanie użytkownika po emailu
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    // Porównanie hasła
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    // Generowanie tokena JWT
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
