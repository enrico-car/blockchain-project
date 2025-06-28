const express = require("express");
const getTokenRouter = require("./token.router");
const getContractRouter = require("./contract.router");
const getProductRouter = require("./product.router");

module.exports = () => {
  const router = express.Router();
  router.use("/token", getTokenRouter());
  router.use("/contract", getContractRouter());
  router.use("/product", getProductRouter());

  return router;
};
