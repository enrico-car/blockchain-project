const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { parseEther } = require("ethers");
const { expect } = require("chai");
const  MIN_CASHBACK_AMOUNT = parseEther("100"); // 100 tokens with 18 decimals

describe("CashbackHandler", function () {
  async function deployCashbackHandler() {
    const [owner, otherAccount] = await ethers.getSigners();

    const CashbackToken = await ethers.getContractFactory("CashbackToken");
    const cashbackToken = await CashbackToken.deploy();
    await cashbackToken.waitForDeployment();

    const CashbackHandler = await ethers.getContractFactory("CashbackHandler");
    const cashbackHandler = await CashbackHandler.deploy(cashbackToken.target);
    await cashbackHandler.waitForDeployment();

    await cashbackToken.setBurnerAuth(cashbackHandler.target, true);

    await cashbackToken.setMinterAuth(owner.address, true);

    return { cashbackHandler, owner, otherAccount, cashbackToken };
  }

  describe("Deployment", function () {
    it("Should use the correct CashbackToken", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandler);

      expect(await cashbackHandler.cashbackToken()).to.equal(cashbackToken.target);
    });
  });

  describe("Redeem Cashback", function () {
    it("Should prevent redeem if the user has not approved the contract to spend tokens", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandler);

      await cashbackToken.approve(cashbackHandler.target, 0);
      
      await expect(cashbackHandler.redeemCashback()).to.be.revertedWith(
        `Contract must be approved to spend at least 100 ${await cashbackToken.symbol()}`
      );
    });

    it("Should prevent reedem if the user has not enough tokens", async function () {
      const { cashbackHandler, cashbackToken } = await loadFixture(deployCashbackHandler);
      
      await cashbackToken.approve(cashbackHandler.target, MIN_CASHBACK_AMOUNT);

      await expect(cashbackHandler.redeemCashback()).to.be.revertedWith(
        `You must have at least 100 ${await cashbackToken.symbol()} to redeem a cashback`
      );
    });

    it("Should transfer and burn tokens after a valid redeem", async function () {
      const { cashbackHandler, owner, cashbackToken } = await loadFixture(deployCashbackHandler);

      await cashbackToken.mint(owner.address, MIN_CASHBACK_AMOUNT);
      await cashbackToken.approve(cashbackHandler.target, MIN_CASHBACK_AMOUNT);

      await expect(cashbackHandler.redeemCashback()).to.emit(cashbackHandler, "CashbackRedeemed")
        .withArgs(owner.address, MIN_CASHBACK_AMOUNT);

      expect(await cashbackToken.balanceOf(owner.address)).to.equal(0);
      expect(await cashbackToken.balanceOf(cashbackHandler.target)).to.equal(0);
    });
    
  });

});
