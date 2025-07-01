const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { keccak256, toUtf8Bytes } = require("ethers");

const sampleProduct = {
  productId: 1,
  DPP: {
    productIdentification: BigInt(keccak256(toUtf8Bytes("Sample Product"))),
    materials: BigInt(keccak256(toUtf8Bytes("Sample Materials"))),
    design: BigInt(keccak256(toUtf8Bytes("Sample Design"))),
    specifications: 0n,
    lifecycle: 0n,
    installation_maintenance: 0n,
    composition: 0n,
    microplastics: 0n,
    env_impact: 0n,
    transport_packaging: 0n,
    sustainability: 0n,
    maintenance: 0n,
    warranty: 0n,
    energy_recovery: 0n,
    substance_of_concern: 0n
  }
};

const sampleLot = {
  lotId: 1,
  LotDetails: {
    timestamp: "0000-00-01T00:00:00Z",
    expirationDate: "0000-00-02",
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

    await productManager.setManufacturerAuth(owner.address, true);
    await productManager.setInventoryManager(owner.address, true);

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

      await expect(productManager.connect(otherAccount).setManufacturerAuth(owner.address, true)).to.be.reverted;
    });

    it("Should allow the owner to modify the ACLs", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManager);

      expect(await productManager.manufacturerUsers(otherAccount.address)).to.equal(false);

      await productManager.setManufacturerAuth(otherAccount.address, true);

      expect(await productManager.manufacturerUsers(otherAccount.address)).to.equal(true);
    });

    it("Should correctly prevent unauthorized access through ACLs", async function () {
      const { productManager, otherAccount } = await loadFixture(deployProductManager);

      await expect(productManager.connect(otherAccount).createProduct(sampleProduct.productId, sampleProduct.DPP)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).removeProduct(sampleProduct.productId)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      )).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).removeLot(sampleLot.lotId)).to.be.revertedWith(
        "Not authorized to use this function"
      );
      await expect(productManager.connect(otherAccount).markLotAsProduced(sampleLot.lotId)).to.be.revertedWith(
        "Not authorized to use this function"
      );
    });
  });

  describe("Product operations", function () {
    it("Should allow authorized users to create new products", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await expect(productManager.createProduct(sampleProduct.productId, sampleProduct.DPP)).to.emit(productManager, "ProductCreated")
        .withArgs(sampleProduct.productId, 
          [
            sampleProduct.DPP.productIdentification, sampleProduct.DPP.materials, sampleProduct.DPP.design,
            sampleProduct.DPP.specifications, sampleProduct.DPP.lifecycle, sampleProduct.DPP.installation_maintenance,
            sampleProduct.DPP.composition, sampleProduct.DPP.microplastics, sampleProduct.DPP.env_impact,
            sampleProduct.DPP.transport_packaging, sampleProduct.DPP.sustainability, sampleProduct.DPP.maintenance,
            sampleProduct.DPP.warranty, sampleProduct.DPP.energy_recovery, sampleProduct.DPP.substance_of_concern
          ]);

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

    it("Should provide information about every product", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      const [productIds, DPPs] = await productManager.getAllProducts();
      expect(productIds[0]).to.equal(sampleProduct.productId);
      expect(DPPs[0].materials).to.equal(sampleProduct.DPP.materials);

    });
  });

  describe("Lot operations", function () {
    it("Should prevent the creation of lots that refer to a product not existing", async function () {
      const { productManager, owner } = await loadFixture(deployProductManager);

      await expect(productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      )).to.be.revertedWith(
        "Product does not exists"
      );
    });

    it("Should allow authorized users to create new lots", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await expect(productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      )).to.emit(productManager, "LotCreated").withArgs(
        sampleLot.lotId, sampleLot.LotDetails.productId, 
        [
          sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate, sampleLot.LotDetails.totalQuantity, 
          sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId, false
        ]
      );

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

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );

      await expect(productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      )).to.be.revertedWith(
        "Lot already exists"
      );
    });

    it("Should prevent the removal of lots not existing", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);
      
      await productManager.createLot(
        0, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );  // Create a different lot, used to have 100% coverage

      await expect(productManager.removeLot(sampleLot.lotId)).to.be.revertedWith(
        "Lot not found"
      );
    });

    it("Should allow autherized users to remove existing lots", async function () {
      const { productManager, owner } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );
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

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );
      
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

    it("Should provide information about every lot", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );
      
      const [lotIds, DPPs] = await productManager.getAllLots();
      expect(lotIds[0]).to.equal(sampleLot.lotId);
      expect(DPPs[0].materials).to.equal(sampleLot.LotDetails.materials);

    });
  });

  describe("Lot production operations", async function () {
    it("Should prevent the removal of lots not existing", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      await expect(productManager.connect(owner).markLotAsProduced(sampleLot.lotId)).to.be.revertedWith(
        "Lot does not exist"
      );
    });

    it("Should prevent multiple production of the same lot", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );

      await productManager.markLotAsProduced(sampleLot.lotId);

      await expect(productManager.connect(owner).markLotAsProduced(sampleLot.lotId)).to.be.revertedWith(
        "Lot already marked as produced"
      );
    });

    it("Should allow autherized users to produce a lot", async function () {
      const { productManager, owner, otherAccount } = await loadFixture(deployProductManagerWithProduct);

      await productManager.createLot(
        sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
        sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
      );

      const lotBefore = await productManager.getLot(sampleLot.lotId);
      expect(lotBefore.hasBeenProduced).to.equal(false);

      await productManager.connect(owner).markLotAsProduced(sampleLot.lotId);
      const lotAfter = await productManager.getLot(sampleLot.lotId);
      expect(lotAfter.hasBeenProduced).to.equal(true);
    });
  });

});
