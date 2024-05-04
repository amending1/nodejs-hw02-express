const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcryptjs");
const {
  User,
  validateSignup,
  validateLogin,
  authenticateToken,
  isImageAndTransform, 
  uploadMiddleware,
  storeImageDir,
  client,
  verificationToken,
} = require("./users-service.js");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const gravatar = require("gravatar");

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

  // ustawiam verification token w modelu User
  newUser.verificationToken = verificationToken;
  await newUser.save();

  // wysyłam email z odnośnikiem do weryfikacji
  const sender = {
    email: process.env.EMAIL_FROM,
    name: "Mailtrap Test",
  };
  const recipients = [
    {
      email: newUser.email,
    }
  ];

  client
    .send({
      from: sender,
      to: recipients,
      subject: "Email verification",
      text: `Please click the following link to verify your email: ${process.env.BASE_URL}/users/verify/${verificationToken}`,
      category: "Integration Test",
    })
    .then(() => {
      console.log('Email sent');

    }, (error) => {
      console.error("Error sending verification email:", error);
      return res.status(500).json({ message: "Internal server error" });
    });

    // gravatar.url(email, options) - funkcja z biblioteki Gravatar, generuje adres URL awatara na podstawie emaila użytkownika. Parametr options - obiekt zawierający opcje konfiguracyjne
    const avatar = gravatar.url(email, { protocol: "https", s: "250" });
    newUser.avatarURL = avatar;

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
    const userId = req.user.id;
    // szukanie użtkownika po id w bazie
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "Not authorized (user was not found in the database)",
      });
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
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "Not authorized (user was not found in the database)",
      });
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

router.patch(
  "/avatars",
  uploadMiddleware.single("avatar"),
  async (req, res, next) => {
    const { path: temporaryPath } = req.file;
    const extension = path.extname(temporaryPath);
    const fileName = `${uuidv4()}${extension}`;
    //  gdy plik został przesłany pomyślnie i znajduje się w katalogu tymczasowym, następuje przeniesienie go do katalogu docelowego
    const filePath = path.join(storeImageDir, fileName);
    try {
      //  funkcja fs.rename zmienia lokalizację pliku tymczasowego na docelowy katalog i nadając mu jednocześnie unikalną nazwę
      await fs.rename(temporaryPath, filePath);
    } catch (error) {
      // W przypadku wystąpienia błędu plik tymczasowy zostaje usunięty
      await fs.unlink(temporaryPath);
      console.error("Error during avatar upload:", error);
      res.status(500).json({ message: "Internal server error" });
      return next(error);
    }
    const isValidAndTransform = await isImageAndTransform(filePath);
        if (!isValidAndTransform) {
            await fs.unlink(filePath);
            return res
                .status(400)
                .json({ message: "File is not a photo" });
        }
    res.send("ok");
  }
);

router.get('/users/verify/:verificationToken', async (req,res) => {
  const { verificationToken } = req.params;

  try {
    // szukam użytkownika po verificationToken
    const user = await User.findOne({ verificationToken});
    if (!user) {
      return res.status(404).json({ message: 'User not found'});
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: 'Verification successful' })
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/users/verify', async (req, res) => {
  const { email } = req.body;

  // walidacja danych wejściowych
  if (!email) {
    return res.status(400).json({ message: 'Missing required field email'});
  }

  try {
    // szukam użytkownika po mailu
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found'});
    }

    // sprawdzam, czy użytkownik nie został już zweryfikowany
    if(user.verify) {
      return res.status(400).json({ message: "Verification has already been passed"});
    }

  // generuję nowy verificationToken
  const verificationToken = uuidv4();

  // ustawiam nowy verificationToken i zapisuję użytkownika
  user.verificationToken = verificationToken;
  await user.save();

  // wysyłam ponownie email z odnośnikiem do werifikacji
  const sender = {
    email: process.env.EMAIL_FROM,
    name: "Mailtrap Test",
  };
  const recipients = [
    {
      email: user.email,
    }
  ];

  client
    .send({
      from: sender,
      to: recipients,
      subject: "Email verification",
      text: `Please click the following link to verify your email: ${process.env.BASE_URL}/users/verify/${verificationToken}`,
      category: "Integration Test",
    })
    .then(() => {
      console.log('Email sent');
      res.status(200).json({ message: "Verification email sent" });
    }, (error) => {
      console.error("Error sending verification email:", error);
      return res.status(500).json({ message: "Internal server error" });
    });
} catch (error) {
  console.error("Error during resending verification email:", error);
  res.status(500).json({ message: "Internal server error" });
  }
})

module.exports = router;
