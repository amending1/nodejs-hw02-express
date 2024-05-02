const { Schema, model } = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const Jimp = require("jimp");

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

  jwt.verify(token, `${process.env.JWT_SECRET}`, (err, user) => {
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

module.exports = {
  User,
  validateSignup,
  validateLogin,
  authenticateToken,
  isImageAndTransform,
};
