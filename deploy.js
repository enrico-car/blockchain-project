// deploy.js
const hre = require("hardhat");
const DeployModule = require("./ignition/modules/Deploy.js");

const fs = require("fs");

async function main() {
  const deployment = await hre.ignition.deploy(DeployModule);

  //   console.log(deployment);

  const addresses = {};
  for (const [name, contract] of Object.entries(deployment)) {
    addresses[name] = contract.target;
  }

  fs.writeFileSync(
    "deployedContracts.json",
    JSON.stringify(addresses, null, 2)
  );

  console.log("Contratti deployati:");
  console.log(addresses);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});