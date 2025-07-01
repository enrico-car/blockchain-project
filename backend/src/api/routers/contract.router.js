const express = require("express");
const path = require("path");
const fs = require("fs");

/**
 * Endpoint used by the frontend to obtain the information about a contract in order
 * to generate an istance handler.
 * 
 * @param {*} req contains the contract name
 * @param {*} res will return the corresponding response with a given code
 * @returns 200, abi and the address of the contract, 404 if the contract is not found in the list
 */
const getContractInfo = async (req, res) => {
  const contractName = req.params.name;

  if (!contractName) {
    return res.status(400).json({ error: "Contract name is required" });
  }

  try {
    // Read ABI
    const abiPath = path.resolve(
      __dirname,
      "..",
      "..",
      "utils",
      "abis",
      `${contractName}.json`
    );

    //console.log(abiPath);

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