const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcryptjs");
const {
  User,
  validateSignup,
  validateLogin,
  authenticateToken,
} = require("./users-service.js");

router.post("/signup", async (req, res) => {
  // Walidacja danych wejściowych
  const { error } = validateSignup(req.body);
  if (error) {
    return res.status(400).json(error.message);
  }

  try {
    const { email, password } = req.body;
    // Sprawdzam, czy email jest już używany
    const existingUser = await User.findOne({ email });
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

    // tworzę payload dla tokena JWT
    const payload = {
      id: user._id,
      username: user.email,
    };
    // Generowanie tokena JWT
    const token = jwt.sign(payload, `${process.env.JWT_SECRET}`, {
      expiresIn: "1h",
    });

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

router.get("/logout", authenticateToken, async (req, res) => {
  try {
    // wyciągam id z tokena
    const userId = req.user._id;
    // szukanie użtkownika po id w bazie
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authorized (user was not found in the database)" });
    }
    // usuwam token użytkownika - token użytkownika jest ustawiany na null, co oznacza, że użytkownik zostaje wylogowany
    user.token = null;
    // zapisanie zmian w obiekcie użytkownika w bazie danych
    await user.save();
    res.status(204).end(); // Sukces - brak zawartości
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/current", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("Error during getting current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
