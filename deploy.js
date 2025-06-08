import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const counter = await ethers.deployContract("Counter");
  console.log("Deployed at:", counter.target);
}

main().catch(console.error);
