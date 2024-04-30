const { Schema, model } = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

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
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized (the token does not exist - it was not sent in the header)' });
  }

  jwt.verify(token,`${process.env.JWT_SECRET}`, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Not authorized (the token is invalid or expired) ' });
    }
    req.user = user;
    next();
  });
};

module.exports = { User, validateSignup, validateLogin, authenticateToken };
