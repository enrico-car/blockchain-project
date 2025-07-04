const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

const abisDir = "/app/shared/abis";
const addressesFile = "/app/shared/deployedContracts.json";

async function main() {
  
  const addressesRaw = fs.readFileSync(addressesFile, "utf-8");
  const addresses = JSON.parse(addressesRaw);

  const proxyAddress = addresses["CashbackHandler"];
  if (!proxyAddress) {
    throw new Error("Proxy address not found");
  }

  const CashbackHandler = await ethers.getContractFactory("CashbackHandlerUpgradable");
  await upgrades.forceImport(proxyAddress, CashbackHandler, { kind: "uups" });

  console.log("Upgrading CashbackHandler at address:", proxyAddress);

  const CashbackHandlerV2 = await ethers.getContractFactory("CashbackHandlerUpgradableV2");

  const upgraded = await upgrades.upgradeProxy(proxyAddress, CashbackHandlerV2);

  console.log("Upgraded to V2 at address:", upgraded.target);
  console.log("Version:", await upgraded.version());

  const artifact = await hre.artifacts.readArtifact("CashbackHandlerUpgradableV2");
  const abiPath = path.join(abisDir, "/CashbackHandler.json");

  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
