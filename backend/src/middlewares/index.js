const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// const corsOptions = {
//   // origin: process.env.FRONTEND_URL || true,
//   origin: "http://localhost:3000",
//   optionsSuccessStatus: 200,
//   credentials: true,
// };

// const sessionConfig = {
//   name: "name",
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: true,
//     sameSite: "None",
//     maxAge: 5 * 60 * 1000,
//   },
//   rolling: true,
// };

module.exports = (app) => {
  // app.use(cors(corsOptions));
  app.use(bodyParser.json({ type: "application/*+json" }));
  // app.use(session(sessionConfig));
  app.use(express.json({ limit: '10mb' }));//for image upload
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use(cookieParser());
};
