const express = require("express");
const path = require("path");
const fs = require("fs");

const getContractInfo = async (req, res) => {
  const contractName = req.params.name;

  if (!contractName) {
    return res.status(400).json({ error: "Contract name is required" });
  }

  try {
    // Read ABI
    // path builds an absolute path
    const abiPath = path.resolve(
      __dirname,
      "..",
      "..",
      "utils",
      "abis",
      `${contractName}.json`
    );

    console.log(abiPath);

    if (!fs.existsSync(abiPath)) {
      return res
        .status(404)
        .json({ error: "ABI not found for contract " + contractName });
    }
    const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const abi = artifact;

    // Read address
    const deployedPath = path.resolve(
      __dirname,
      "..",
      "..",
      "utils",
      "deployedContracts.json"
    );
    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    const address = deployed[contractName];
    if (!address) {
      return res
        .status(404)
        .json({ error: "Address not found for contract " + contractName });
    }

    // Send JSON response
    res.status(200).json({ abi, address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = function () {
  const router = express.Router();

  router.get("/:name", getContractInfo);

  return router;
};
