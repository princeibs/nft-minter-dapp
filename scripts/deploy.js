// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const GemNFT = await hre.ethers.getContractFactory("GemNFT");
  const gemNFT = await GemNFT.deploy();

  await gemNFT.deployed();

  console.log("GemNFT deployed to:", gemNFT.address);
  storeContractData(gemNFT);
}

function storeContractData(contract) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/GemNFT-address.json",
    JSON.stringify({ GemNFT: contract.address }, undefined, 2)
  );

  const GemNFTArtifact = artifacts.readArtifactSync("GemNFT");

  fs.writeFileSync(
    contractsDir + "/GemNFT.json",
    JSON.stringify(GemNFTArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
