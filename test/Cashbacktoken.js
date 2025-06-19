const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("CashbackToken", function () {
  async function deployCashbackToken() {
        const [owner, otherAccount] = await ethers.getSigners();

    const CashbackToken = await ethers.getContractFactory("CashbackToken");
    const cashbackToken = await CashbackToken.deploy();

    return { cashbackToken, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy the right token", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      expect(await cashbackToken.name()).to.equal("CashbackToken");
      expect(await cashbackToken.symbol()).to.equal("CSHBK");
    });

    it("Should start without any supply", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      expect(await cashbackToken.totalSupply()).to.equal(0);
    });

    it("Should set the right owner", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      expect(await cashbackToken.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control Lists", function () {
    it("Should allow the owner to modify the ACLs", async function () {
      const { cashbackToken, owner, otherAccount } = await loadFixture(deployCashbackToken);

      expect(await cashbackToken.authorizedBurners(owner.address)).to.equal(false);
      expect(await cashbackToken.authorizedMinters(owner.address)).to.equal(false);

      await cashbackToken.setBurnerAuth(owner.address, true);
      await cashbackToken.setMinterAuth(owner.address, true);

      expect(await cashbackToken.authorizedBurners(owner.address)).to.equal(true);
      expect(await cashbackToken.authorizedMinters(owner.address)).to.equal(true);
      expect(await cashbackToken.authorizedBurners(otherAccount.address)).to.equal(false);
      expect(await cashbackToken.authorizedMinters(otherAccount.address)).to.equal(false);
    });

    it("Should correctly prevent unauthorized access through ACLs", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      await expect(cashbackToken["burn(address,uint256)"](owner.address, 1)).to.be.revertedWith(
        "Not authorized to burn"
      );
      await expect(cashbackToken.mint(owner.address, 1)).to.be.revertedWith(
        "Not authorized to mint"
      );
    });
  });

  describe("Mint and Burn operations", function () {
    it("Should allow authorized minter to mint tokens", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      const initialBalance = await cashbackToken.balanceOf(owner.address);
      expect(initialBalance).to.equal(0);

      const mintAmount = 1000;
      await cashbackToken.setMinterAuth(owner.address, true);
      await cashbackToken.mint(owner.address, mintAmount);

      expect(await cashbackToken.balanceOf(owner.address)).to.equal(mintAmount);
    });

    it("Should allow authorized burners to burn tokens", async function () {
      const { cashbackToken, owner } = await loadFixture(deployCashbackToken);

      const initialBalance = await cashbackToken.balanceOf(owner.address);
      expect(initialBalance).to.equal(0);

      const mintAmount = 1000;
      await cashbackToken.setMinterAuth(owner.address, true);
      await cashbackToken.mint(owner.address, mintAmount);

      await cashbackToken.setBurnerAuth(owner.address, true);
      const burnAmount = 500;
      await cashbackToken["burn(address,uint256)"](owner.address, burnAmount);

      expect(await cashbackToken.balanceOf(owner.address)).to.equal(mintAmount - burnAmount);
    });

    
  });

});

// TODO: La funzione burn(uint256 amount) non è stata testata, in quanto non sappiamo se mantenerla o eliminarla.