const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { parseEther } = require("ethers");
const { upgrades, ethers } = require("hardhat");
const { expect } = require("chai");
const  MIN_CASHBACK_AMOUNT = parseEther("100"); // 100 tokens in ETH

describe("CashbackHandlerUpgradable", function () {
  async function deployCashbackHandlerUpgradable() {
    const [owner, otherAccount] = await ethers.getSigners();

    const CashbackToken = await ethers.getContractFactory("CashbackToken");
    const cashbackToken = await CashbackToken.deploy();
    await cashbackToken.waitForDeployment();

    const CashbackHandler = await ethers.getContractFactory("CashbackHandlerUpgradable");
    const cashbackHandler = await upgrades.deployProxy(CashbackHandler, [cashbackToken.target], { kind: "uups" });
    await cashbackHandler.waitForDeployment();

    await cashbackToken.setBurnerAuth(cashbackHandler.target, true);

    await cashbackToken.setMinterAuth(owner.address, true);

    return { cashbackHandler, owner, otherAccount, cashbackToken };
  }

  describe("Deployment", function () {
    it("Should use the correct CashbackToken", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);

      expect(await cashbackHandler.cashbackToken()).to.equal(cashbackToken.target);
    });
  });

  describe("Redeem Cashback", function () {
    it("Should prevent redeem if the user has not approved the contract to spend tokens", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);

      await cashbackToken.approve(cashbackHandler.target, 0);
      
      await expect(cashbackHandler.redeemCashback()).to.be.revertedWith(
        `Contract must be approved to spend at least 100 ${await cashbackToken.symbol()}`
      );
    });

    it("Should prevent reedem if the user has not enough tokens", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);
      
      await cashbackToken.approve(cashbackHandler.target, MIN_CASHBACK_AMOUNT);

      await expect(cashbackHandler.redeemCashback()).to.be.revertedWith(
        `You must have at least 100 ${await cashbackToken.symbol()} to redeem a cashback`
      );
    });

    it("Should transfer and burn tokens after a valid redeem", async function () {
      const { cashbackHandler, owner, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);

      await cashbackToken.mint(owner.address, MIN_CASHBACK_AMOUNT);
      await cashbackToken.approve(cashbackHandler.target, MIN_CASHBACK_AMOUNT);

      await expect(cashbackHandler.redeemCashback()).to.emit(cashbackHandler, "CashbackRedeemed")
        .withArgs(owner.address, MIN_CASHBACK_AMOUNT);

      expect(await cashbackToken.balanceOf(owner.address)).to.equal(0);
      expect(await cashbackToken.balanceOf(cashbackHandler.target)).to.equal(0);
    });
    
  });

  describe("Upgradability", function () {
    it("Initial version should not be able to execute version()", async function () {
      const { cashbackHandler } = await loadFixture(deployCashbackHandlerUpgradable);

      expect("version" in cashbackHandler).to.be.false; // Check if version function does not exist
    });

    it("Should allow owner to upgrade the contract", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);

      const CashbackHandlerV2 = await ethers.getContractFactory("CashbackHandlerUpgradableV2");
      const cashbackHandlerV2 = await upgrades.upgradeProxy(cashbackHandler.target, CashbackHandlerV2);
      
      await cashbackHandlerV2.waitForDeployment();
      
      expect(cashbackHandlerV2.target).to.equal(cashbackHandler.target);
    });

    it("Upgraded version should be able to execute version()", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandlerUpgradable);

      const CashbackHandlerV2 = await ethers.getContractFactory("CashbackHandlerUpgradableV2");
      const cashbackHandlerV2 = await upgrades.upgradeProxy(cashbackHandler.target, CashbackHandlerV2);
      
      await cashbackHandlerV2.waitForDeployment();


      expect("version" in cashbackHandlerV2).to.be.true;   // Check if version function exist
      expect(await cashbackHandlerV2.version()).to.equal("V2");
    });

    it("Upgraded version should be able to redeem prametric amounts of tokens", async function () {
      const { cashbackHandler, cashbackToken , owner} = await loadFixture(deployCashbackHandlerUpgradable);

      const CashbackHandlerV2 = await ethers.getContractFactory("CashbackHandlerUpgradableV2");
      const cashbackHandlerV2 = await upgrades.upgradeProxy(cashbackHandler.target, CashbackHandlerV2);
      
      await cashbackHandlerV2.waitForDeployment();

      const PARAMETRIC_CASHBACK_AMOUNT = parseEther("200")

      await cashbackToken.mint(owner.address, PARAMETRIC_CASHBACK_AMOUNT);
      await cashbackToken.approve(cashbackHandler.target, PARAMETRIC_CASHBACK_AMOUNT);
      expect(await cashbackHandlerV2["redeemCashback(uint256)"](PARAMETRIC_CASHBACK_AMOUNT)).to.
        emit(cashbackHandler, "CashbackRedeemed").withArgs(owner.address, PARAMETRIC_CASHBACK_AMOUNT);

      expect(await cashbackToken.balanceOf(owner.address)).to.equal(0);
      expect(await cashbackToken.balanceOf(cashbackHandler.target)).to.equal(0);
    });
  });

});
