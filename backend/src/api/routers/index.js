const express = require("express");
const getContractRouter = require("./contract.router");
const getProductRouter = require("./product.router");
const getUserRouter = require("./user.router");

module.exports = () => {
  const router = express.Router();
  router.use("/contract", getContractRouter());
  router.use("/product", getProductRouter());
  router.use("/user", getUserRouter());

  return router;
};