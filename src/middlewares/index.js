const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

// const corsOptions = {
//   // origin: process.env.FRONTEND_URL || true,
//   origin: "http://localhost:3000",
//   optionsSuccessStatus: 200,
//   credentials: true,
// };

// const sessionConfig = {
//   name: "name",
//   secret: process.env.SESSION_SECRET,
//   resave: false, // Settato a false, il rolling effettua gia' il controllo e decide se modificare il cookie
//   saveUninitialized: false, // la sessione non verrà salvata nel session store finché non ci scrivi qualcosa dentro (es. req.session.userId = "User")
//   cookie: {
//     httpOnly: true, // Previene l’accesso ai cookie da parte di JavaScript lato client
//     secure: true, // Assicura che i cookie siano inviati solo su HTTPS
//     sameSite: "None", // Le richieste devono essere inviabili da qualsiasi sorgente
//     maxAge: 5 * 60 * 1000, // Impsta la durata della sessione a 5min
//   },
//   rolling: true, // Estende la scadenza ad ogni richiesta
// };

module.exports = (app) => {
  // app.use(cors(corsOptions));
  app.use(bodyParser.json({ type: "application/*+json" }));
  // app.use(session(sessionConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use(cookieParser());
};
