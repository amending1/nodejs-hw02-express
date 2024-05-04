const { Schema, model } = require("mongoose");
const Joi = require("joi");

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Jimp = require("jimp");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const { MailtrapClient } = require("mailtrap");

const userSchema = new Schema({
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
  avatarURL: {
    type: String,
    default: null,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, "Verify token is required"],
  },
});

const User = model("users", userSchema);

// Walidacja danych dla rejestracji
const validateSignup = (data) => {
  console.log("check");
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

// Walidacja danych dla logowania
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const authenticateToken = (req, res, next) => {
  // ten middleware zaczyna od pobrania nagłówka Authorization z żądania req.headers.authorization. Ten nagłówek zawiera token JWT, który klient przesyła w celu uwierzytelnienia
  const authHeader = req.headers.authorization;
  // nagłówek Authorization zawiera typ autoryzacji (zwykle "Bearer") oraz token JWT. Middleware rozdziela ten nagłówek na dwie części za pomocą spacji i wybiera drugą część (dlatego indeks 1) jako sam token
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message:
        "Not authorized (the token does not exist - it was not sent in the header)",
    });
  }
  const generateJWTSecret = () => {
    return crypto.randomBytes(32).toString("hex");
  };
  const JWT_SECRET = generateJWTSecret();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Not authorized (the token is invalid or expired) " });
    }
    req.user = user;
    next();
  });
};

const MAX_AVATAR_WIDTH = 250;
const MAX_AVATAR_HEIGHT = 250;

const isImageAndTransform = async (path) =>
  new Promise((resolve) => {
    Jimp.read(path, async (error, image) => {
      if (error) resolve(false);

      try {
        const width = image.getWidth();
        const height = image.getHeight();

        const cropWidth = width > MAX_AVATAR_WIDTH ? MAX_AVATAR_WIDTH : width;
        const cropHeight =
          height > MAX_AVATAR_HEIGHT ? MAX_AVATAR_HEIGHT : height;

        const centerX = Math.round(width / 2 - cropWidth / 2);
        const centerY = Math.round(height / 2 - cropHeight / 2);

        await image
          .rotate(360)
          .crop(
            centerX < 0 ? 0 : centerX,
            centerY < 0 ? 0 : centerY,
            cropWidth,
            cropHeight
          )
          .write(path);
        resolve(true);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  });

// TWORZENIE AVATARA
// konfiguracja multera
// tworzę ścieżki do katalogów
// Pliki są przechowywane tutaj tylko tymczasowo, zanim zostaną przeniesione do ich ostatecznego miejsca docelowego (czyli storeImageDir). Ten katalog jest używany do uniknięcia konfliktów nazw plików i umożliwienia przetwarzania wielu plików jednocześnie, bez ryzyka nadpisania istniejących plików
// process.cwd() ZWRACA bieżący katalog roboczy procesu Node.js. Katalog roboczy to katalog, w którym proces Node.js został uruchomiony. Oznacza to, że process.cwd() zwraca ścieżkę do katalogu, w którym znajduje się plik JavaScript, w którym wywołano tę funkcję, w momencie uruchomienia programu.
const temporaryDir = path.join(process.cwd(), "tmp");
console.log(temporaryDir);
// katalog docelowy - po przetworzeniu i sprawdzeniu poprawności plików w katalogu tymczasowym, są one przenoszone tu
const storeImageDir = path.join(process.cwd(), "public/avatars");
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, temporaryDir);
  },
  filename: function (req, file, callback) {
    callback(null, `${uuidv4()}${file.originalname}`);
  },
});

const extensionWhiteList = [".jpg", ".jpeg", ".png", ".gif"];
// Typy MIME (Multipurpose Internet Mail Extensions) są sposobem identyfikowania formatów plików i typów treści w Internecie. Są wykorzystywane do określenia rodzaju danych zawartych w pliku na podstawie jego nagłówka lub rozszerzenia
const mimetypeWhiteList = ["image/png", "image/jpg", "image/jpeg", "image/gif"];

const uploadMiddleware = multer({
  storage,
  fileFilter: async (req, file, callback) => {
    // zwraca rozszerzenie pliku na podstawie podanej ścieżki do pliku (więc zwraca '.jpg')
    const extension = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;
    if (
      !extensionWhiteList.includes(extension) ||
      !mimetypeWhiteList.includes(mimetype)
    ) {
      return callback(null, false); // plik zostanie odrzucony
    }
    return callback(null, true); // pozwala na przetworzenie pliku
  },
});

const client = new MailtrapClient({
  endpoint: "https://send.api.mailtrap.io/",
  token: process.env.MAILTRAP_API_KEY,
});

// generowanie tokenu weryfikacyjnego
const verificationToken = uuidv4();

module.exports = {
  User,
  validateSignup,
  validateLogin,
  authenticateToken,
  isImageAndTransform,
  uploadMiddleware,
  storeImageDir,
  client,
  verificationToken,
};
