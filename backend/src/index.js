require("dotenv").config();
const express = require("express");
const cors = require('cors');
const middlewares = require("./middlewares");
// const https = require("https");
const mongoose = require('mongoose');
const http = require("http");
const fs = require("fs");
const getApisRouter = require("./api/router");
const bodyParser = require("body-parser");

// Blockchain Dependences
const { Web3 } = require("web3");
const CashbackToken = require("./utils/abis/CashbackToken.json");

const app = express();
middlewares(app);

app.use(cors());

app.use(bodyParser.json());
app.use("/api", getApisRouter());

const port = process.env.PORT || 3000;

// Test for connection to the Hardhat network
app.get("/", async (req, res) => {
  const web3 = new Web3(process.env.CHAIN_URL);
  const account = web3.eth.accounts.privateKeyToAccount(
    process.env.PRIVATE_KEY
  );
  // web3.eth.accounts.wallet.add(account); // <- Aggiunge l'account al wallet di Web3
  // web3.eth.defaultAccount = account.address;

  // console.log(account);

  // console.log(await web3.eth.getAccounts());

  const contract = new web3.eth.Contract(
    CashbackToken.abi,
    process.env.CASHBACK_TOKEN_ADDRESS
  );

  try {
    // // Will call a “constant” method and execute its smart contract method in the EVM
    const owner_token = await contract.methods
      .owner(process.env.CASHBACK_TOKEN_ADDRESS)
      .call();
    console.log(owner_token);

    const owner_handler = await contract.methods
      .owner(process.env.CASHBACK_HANDLER_ADDRESS)
      .call();
    console.log(owner_handler);

    const balance = await contract.methods.balanceOf(account.address).call();
    console.log(balance);
  } catch (error) {
    console.log(error);
  }

  // console.log(contract);

  res.send("Hello World!");
});

// const httpsOptions = {
//   key: fs.readFileSync("./certificate/private.key"),
//   cert: fs.readFileSync("./certificate/server.crt"),
// };

// https.createServer(httpsOptions, app).listen(port, async () => {
//   await db.connect();
//   console.log(`Server HTTPS avviato su https://localhost:${port}`);
// });

http.createServer(app).listen(port, async () => {
  // await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@blockchain.vjumxip.mongodb.net/?retryWrites=true&w=majority&appName=Blockchain`);
  await mongoose.connect(`mongodb://mongodb:27017/blockchain`);
  console.log(`Server HTTP avviato su http://localhost:${port}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down the server");
  server.close();
  process.exit();
});
