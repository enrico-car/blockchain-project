const express = require("express");
const getTokenRouter = require("./token.router");
const getContractRouter = require("./contract.router");

module.exports = () => {
  const router = express.Router();
  router.use("/token", getTokenRouter());
  router.use("/contract", getContractRouter());

  return router;
};
