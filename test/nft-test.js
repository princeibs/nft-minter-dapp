const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultaVerse", function () {
  this.timeout(50000);

  let multaVerse;
  let owner;
  let acc1;
  let acc2;
  let contractAddress;

  this.beforeEach(async function() {
      // This is executed before each test
      // Deploying the smart contract
      const MultaVerse = await ethers.getContractFactory("MultaVerse");
      [owner, acc1, acc2] = await ethers.getSigners();

      multaVerse = await MultaVerse.deploy();
      await multaVerse.deployed();
      contractAddress = multaVerse.address;
  })

  it("Should set the right owner", async function () {
      expect(await multaVerse.owner()).to.equal(owner.address);
  });

  it("Should mint one NFT", async function() {
      expect(await multaVerse.balanceOf(contractAddress)).to.equal(0);
      
      const tokenValue = 100;
      const tokenURI = "https://example.com";
      const tx = await multaVerse.connect(owner).mintToken(tokenURI, tokenValue);
      await tx.wait();

      expect(await multaVerse.balanceOf(contractAddress)).to.equal(1);
  })

  it("Should set the correct tokenURI", async function() {
      const tokenURI_1 = "https://example.com/1"
      const tokenURI_2 = "https://example.com/2"

      const tx1 = await multaVerse.connect(owner).mintToken(tokenURI_1, 100);
      await tx1.wait();
      const tx2 = await multaVerse.connect(owner).mintToken(tokenURI_2, 200);
      await tx2.wait();

      expect(await multaVerse.tokenURI(0)).to.equal(tokenURI_1);
      expect(await multaVerse.tokenURI(1)).to.equal(tokenURI_2);
  })
});
