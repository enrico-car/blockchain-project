const express = require("express");
const getTokenRouter = require("./token.router");

module.exports = () => {
  const router = express.Router();
  router.use("/token", getTokenRouter());

  return router;
};
