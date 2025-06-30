const hre = require("hardhat");
const DeployModule = require("../ignition/modules/Deploy.js");
const fs = require("fs");
const path = require("path");

async function main() {
  const deployment = await hre.ignition.deploy(DeployModule);

  const abisDir = "/app/shared/abis";
  const addressesFile = "/app/shared/deployedContracts.json";
  const walletsFile = "/app/shared/wallets.json";

  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const addresses = {};

  const signers = await hre.ethers.getSigners();
  const walletDetails = [];

  for (const signer of signers) {
    const address = await signer.getAddress();
    walletDetails.push({
      address
    });
  }

  fs.writeFileSync(walletsFile, JSON.stringify(walletDetails, null, 2));
  console.log("✅ Wallet info saved in", walletsFile);


  for (const [name, contract] of Object.entries(deployment)) {
    addresses[name] = contract.target;

    try {
      console.log(`📦 Fetching ABI for ${name}`);
      const artifact = await hre.artifacts.readArtifact(name);

      // Salva l`ABI
      fs.writeFileSync(
        path.join(abisDir, `${name}.json`),
        JSON.stringify(artifact.abi, null, 2)
      );
    } catch (err) {
      console.error(`❌ Error fetching ABI for ${name}:`, err);
    }
  }

  console.log("Contract addresses: ", addresses);

  // Salva gli address dei contratti
  fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
  console.log("✅ Address saved in", addressesFile);
  console.log("✅ ABI saved in", abisDir);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});