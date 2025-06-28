const express = require("express");
const { Web3 } = require("web3");
const CashbackToken = require("../../utils/abis/CashbackToken.json");

const web3 = new Web3(process.env.CHAIN_URL);

// Initialize and add the account to the Web3 wallet
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function generate(req, res) {
  // Get the Token contract using the abi and the contract address
  const token_contract = new web3.eth.Contract(
    CashbackToken.abi,
    process.env.CASHBACK_TOKEN_ADDRESS
  );

  try {
    // Convert the Token amount in the right format
    const amount = web3.utils.toBigInt(100000000000000000000);

    // console.log(decimals);
    // console.log(amount);

    let result = token_contract.methods
      .mint("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", amount)
      .send({
        from: account.address,
      });
  } catch (error) {
    console.log(error);
  }

  // console.log(contract);
  res.send("Token generated");
}

module.exports = function () {
  const router = express.Router();

  // router.post("/generate", generate);
  router.get("/generate", generate);

  return router;
};
