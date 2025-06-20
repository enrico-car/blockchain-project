const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const sampleProduct = {
  productId: 1,
  DPP: {
    productIdentification: "Sample Product",
    materials: "Sample Materials",
  }
};

const sampleLot = {
  lotId: 1,
  LotDetails: {
    expirationDate: "0000-00-01",
    totalQuantity: 100,
    unitPrice: 10,
    productId: sampleProduct.productId,
  }
}

describe("ProductManager", function () {
  async function deployProductManager() {
    const [owner, otherAccount] = await ethers.getSigners();

    const ProductManager = await ethers.getContractFactory("ProductManager");
    const productManager = await ProductManager.deploy();
    await productManager.waitForDeployment();

    await productManager.setUserAuth(owner.address, true);

    return { productManager, owner, otherAccount };
  }

  async function deployProductManagerWithProduct() {
    const { productManager, owner, otherAccount } = await loadFixture(deployProductManager);
    
    await productManager.createProduct(sampleProduct.productId, sampleProduct.DPP);

    return { productManager, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      expect(await productManager.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control Lists", function () {
    it("Should prevent unauthorized changes to the ACLs", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManager);

      await expect(productManager.connect(otherAccount).setUserAuth(owner.address, true)).to.be.reverted;
    });

    it("Should allow the owner to modify the ACLs", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManager);

      expect(await productManager.authorizedUsers(otherAccount.address)).to.equal(false);

      await productManager.setUserAuth(otherAccount.address, true);

      expect(await productManager.authorizedUsers(otherAccount.address)).to.equal(true);
    });

    it("Should correctly prevent unauthorized access through ACLs", async function () {
      const { productManager, otherAccount } = await loadFixture(deployProductManager);

      await expect(productManager.connect(otherAccount).createProduct(sampleProduct.productId, sampleProduct.DPP)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).removeProduct(sampleProduct.productId)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).createLot(sampleLot.lotId, sampleLot.LotDetails)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).removeLot(sampleLot.lotId)).to.be.revertedWith(
        "Not authorized to use this function"
      );
    });
  });

  describe("Product operations", function () {
    it("Should allow authorized users to create new products", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await expect(productManager.createProduct(sampleProduct.productId, sampleProduct.DPP)).to.emit(productManager, "ProductCreated")
        .withArgs(sampleProduct.productId, [sampleProduct.DPP.productIdentification, sampleProduct.DPP.materials]);

      expect(await productManager.productsIds(0)).to.equal(sampleProduct.productId);
      expect((await productManager.products(sampleProduct.productId)).productIdentification)
        .to.equal(sampleProduct.DPP.productIdentification);
        expect((await productManager.products(sampleProduct.productId)).materials)
        .to.equal(sampleProduct.DPP.materials);
    });

    it("Should prevent the creation of multiple products with the same product ID", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await productManager.createProduct(sampleProduct.productId, sampleProduct.DPP);

      await expect(productManager.createProduct(sampleProduct.productId, sampleProduct.DPP)).to.be.revertedWith(
        "Product already exists"
      );
    });

    it("Should prevent the removal of products not existing", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await productManager.createProduct(0, sampleProduct.DPP);  // Create a different lot, used to have 100% coverage

      await expect(productManager.removeProduct(sampleProduct.productId)).to.be.revertedWith(
        "Product not found"
      );
    });

    it("Should allow autherized users to remove existing products", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await productManager.createProduct(sampleProduct.productId, sampleProduct.DPP);
      await expect(productManager.removeProduct(sampleProduct.productId)).to.emit(productManager, "ProductRemoved")
        .withArgs(sampleProduct.productId);

      expect((await productManager.products(sampleProduct.productId)).productIdentification)
        .to.equal("");
      expect((await productManager.products(sampleProduct.productId)).materials)
        .to.equal("");
    });

    it("Should prevent the request of information about not existing products", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await expect(productManager.getProduct(sampleProduct.productId)).to.be.revertedWith(
        "Product does not exists"
      );
    });

    it("Should provide information about existing products", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManager);

      await productManager.createProduct(sampleProduct.productId, sampleProduct.DPP);
      
      expect((await productManager.getProduct(sampleProduct.productId)).productIdentification)
        .to.equal(sampleProduct.DPP.productIdentification);
      expect((await productManager.getProduct(sampleProduct.productId)).materials)
        .to.equal(sampleProduct.DPP.materials);

      expect((await productManager.connect(otherAccount).getProduct(sampleProduct.productId)).productIdentification)
        .to.equal(sampleProduct.DPP.productIdentification);
      expect((await productManager.connect(otherAccount).getProduct(sampleProduct.productId)).materials)
        .to.equal(sampleProduct.DPP.materials);

    });
    
  });

  describe("Lot operations", function () {  // TODO: Creare nuova fixture per i test dei lotti, in cui creo già un prodotto
    it("Should prevent the creation of lots that refer to a product not existng", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await expect(productManager.createLot(sampleLot.lotId, sampleLot.LotDetails)).to.be.revertedWith(
        "Product does not exists"
      );
    });

    it("Should allow authorized users to create new lots", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await expect(productManager.createLot(sampleLot.lotId, sampleLot.LotDetails)).to.emit(productManager, "LotCreated")
        .withArgs(sampleLot.lotId, sampleLot.LotDetails.productId, 
          [sampleLot.LotDetails.expirationDate, sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId]);

      expect(await productManager.productsIds(0)).to.equal(sampleLot.lotId);
      expect((await productManager.lots(sampleLot.lotId)).expirationDate)
        .to.equal(sampleLot.LotDetails.expirationDate);
      expect((await productManager.lots(sampleLot.lotId)).totalQuantity)
      .to.equal(sampleLot.LotDetails.totalQuantity);
      expect((await productManager.lots(sampleLot.lotId)).unitPrice)
      .to.equal(sampleLot.LotDetails.unitPrice);
      expect((await productManager.lots(sampleLot.lotId)).productId)
      .to.equal(sampleLot.LotDetails.productId);
    });

    it("Should prevent the creation of multiple lots with the same lot ID", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(sampleLot.lotId, sampleLot.LotDetails);

      await expect(productManager.createLot(sampleLot.lotId, sampleLot.LotDetails)).to.be.revertedWith(
        "Lot already exists"
      );
    });

    it("Should prevent the removal of lots not existing", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);
      
      await productManager.createLot(0, sampleLot.LotDetails);  // Create a different lot, used to have 100% coverage

      await expect(productManager.removeLot(sampleLot.lotId)).to.be.revertedWith(
        "Lot not found"
      );
    });

    it("Should allow autherized users to remove existing lots", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(sampleLot.lotId, sampleLot.LotDetails);
      await expect(productManager.removeLot(sampleLot.lotId)).to.emit(productManager, "LotRemoved")
        .withArgs(sampleLot.lotId);

      expect((await productManager.lots(sampleLot.lotId)).expirationDate)
        .to.equal("");
      expect((await productManager.lots(sampleLot.lotId)).totalQuantity)
        .to.equal("");
      expect((await productManager.lots(sampleLot.lotId)).unitPrice)
        .to.equal("");
      expect((await productManager.lots(sampleLot.lotId)).productId)
        .to.equal("");
    });

    it("Should prevent the request of information about not existing lots", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await expect(productManager.getLot(sampleLot.lotId)).to.be.revertedWith(
        "Lot does not exists"
      );
    });

    it("Should provide information about existing lots", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(sampleLot.lotId, sampleLot.LotDetails);
      
      expect((await productManager.getLot(sampleLot.lotId)).lotIdentification)
        .to.equal(sampleLot.LotDetails.lotIdentification);
      expect((await productManager.getLot(sampleLot.lotId)).materials)
        .to.equal(sampleLot.LotDetails.materials);

      expect((await productManager.connect(otherAccount).getLot(sampleLot.lotId)).expirationDate)
        .to.equal(sampleLot.LotDetails.expirationDate);
      expect((await productManager.connect(otherAccount).getLot(sampleLot.lotId)).totalQuantity)
        .to.equal(sampleLot.LotDetails.totalQuantity);
      expect((await productManager.connect(otherAccount).getLot(sampleLot.lotId)).unitPrice)
        .to.equal(sampleLot.LotDetails.unitPrice);
      expect((await productManager.connect(otherAccount).getLot(sampleLot.lotId)).productId)
        .to.equal(sampleLot.LotDetails.productId);

    });
    
  });

});
