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
    timestamp: "0000-00-01T00:00:00Z",
    expirationDate: "0000-00-02",
    totalQuantity: 100,
    unitPrice: 10,
    productId: sampleProduct.productId,
  }
}

const sampleLot2 = {
  lotId: 2,
  LotDetails: {
    timestamp: "0000-00-02T00:00:00Z",
    expirationDate: "0000-00-03",
    totalQuantity: 200,
    unitPrice: 20,
    productId: sampleProduct.productId,
  }
}

const sampleInventory = {
    lotId: sampleLot.lotId,
    quantity: 50,
}

const sampleInventory2 = {
    lotId: sampleLot2.lotId,
    quantity: 50,
}

describe("InventoryManager", function () {
  async function deployInventoryManager() {
    const [owner, otherAccount] = await ethers.getSigners();

    const ProductManager = await ethers.getContractFactory("ProductManager");
    const productManager = await ProductManager.deploy();
    await productManager.waitForDeployment();
    await productManager.setUserAuth(owner.address, true);

    const InventoryManager = await ethers.getContractFactory("InventoryManager");
    const inventoryManager = await InventoryManager.deploy(productManager.target);
    await inventoryManager.waitForDeployment();

    await inventoryManager.setUserAuth(owner.address, true);
    await inventoryManager.setManufacturerAuth(owner.address, true);
    await productManager.setInventoryManager(inventoryManager.target, true);

    await productManager.setInventoryManager(inventoryManager.target, true);

    return { inventoryManager, owner, otherAccount, productManager };
  }

  async function deployInventoryManagerWithLot() {
    const { inventoryManager, owner, otherAccount, productManager } = await loadFixture(deployInventoryManager);

    await productManager.createProduct(sampleProduct.productId, sampleProduct.DPP);
    await productManager.createLot(
      sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
      sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
    );
    await productManager.createLot(
      sampleLot2.lotId, sampleLot2.LotDetails.timestamp, sampleLot2.LotDetails.expirationDate,
      sampleLot2.LotDetails.totalQuantity, sampleLot2.LotDetails.unitPrice, sampleLot2.LotDetails.productId
    );

    return { inventoryManager, owner, otherAccount, productManager };
  }

  describe("Deployment", function () {
    it("Should use the correct ProductManager", async function () {
      const { inventoryManager, productManager } = await loadFixture(deployInventoryManager);

      expect(await inventoryManager.productManager()).to.equal(productManager.target);
    });

    it("Should set the right owner", async function () {
      const { productManager, owner } = await loadFixture(deployInventoryManager);

      expect(await productManager.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control Lists", function () {
      it("Should prevent unauthorized changes to the ACLs", async function () {
        const { inventoryManager, owner, otherAccount } = await loadFixture(deployInventoryManager);
  
        await expect(inventoryManager.connect(otherAccount).setUserAuth(owner.address, true)).to.be.reverted;
        await expect(inventoryManager.connect(otherAccount).setManufacturerAuth(owner.address, true)).to.be.reverted;
      });
  
      it("Should allow the owner to modify the ACLs", async function () {
        const { inventoryManager, owner, otherAccount } = await loadFixture(deployInventoryManager);
  
        expect(await inventoryManager.authorizedUsers(otherAccount.address)).to.equal(false);
        expect(await inventoryManager.manufacturerUsers(otherAccount.address)).to.equal(false);
  
        await inventoryManager.setUserAuth(otherAccount.address, true);
        await inventoryManager.setManufacturerAuth(otherAccount.address, true);
  
        expect(await inventoryManager.authorizedUsers(otherAccount.address)).to.equal(true);
        expect(await inventoryManager.manufacturerUsers(otherAccount.address)).to.equal(true);
      });
  
      it("Should correctly prevent unauthorized access through ACLs", async function () {
        const { inventoryManager, owner, otherAccount } = await loadFixture(deployInventoryManager);
  
        await expect(inventoryManager.connect(otherAccount).addToInventory(otherAccount.address, sampleInventory.lotId, sampleInventory.quantity))
            .to.be.revertedWith("Not authorized to use this function");
        await expect(inventoryManager.connect(otherAccount).removeFromInventory(otherAccount.address, sampleInventory.lotId, sampleInventory.quantity))
            .to.be.revertedWith("Not authorized to use this function");
        await expect(inventoryManager.connect(otherAccount).getInventory(otherAccount.address))
            .to.be.revertedWith("Not authorized to use this function");
        await expect(inventoryManager.connect(otherAccount).addToManufacturerInventory(sampleLot.lotId))
            .to.be.revertedWith("Only the manufacturer is allowed to use this function");
      });
    });

  describe("Inventory operations", function () {
    it("Should prevent the addition of lots that do not exist", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManager);

        await expect(inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity)).to.be.revertedWith(
            "Lot does not exists"
        );
    });

    it("Should allow authorized users to add lots to an inventory", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity);
        const [lotIds, quantities] = await inventoryManager.getInventory(owner.address);
        expect(lotIds[0]).to.equal(sampleInventory.lotId);
        expect(quantities[0]).to.equal(sampleInventory.quantity);

        await inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity);
    });

    it("Should prevent the removal of lots that do not exist", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManager);

        await expect(inventoryManager.removeFromInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity)).to.be.revertedWith(
            "Lot does not exists"
        );
    });

    it("Should prevent the removal of lots in a quantity higher than the owned one", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await expect(inventoryManager.removeFromInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity)).to.be.revertedWith(
            `Quantity (${sampleInventory.quantity}) is bigger than the amount in inventory (${0})`
        ); 
    });

    it("Should allow authorized users to remove lots from an inventory", async function () {    // TODO sistemare branch non preso
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity);
        await inventoryManager.addToInventory(owner.address, sampleInventory2.lotId, sampleInventory2.quantity);

        await inventoryManager.removeFromInventory(owner.address, sampleInventory2.lotId, sampleInventory2.quantity-1);

        await inventoryManager.removeFromInventory(owner.address, sampleInventory2.lotId, 1);

        const [lotIds, quantities] = await inventoryManager.getInventory(owner.address);
        expect(lotIds).to.deep.equal([sampleInventory.lotId]);
        expect(quantities).to.deep.equal([sampleInventory.quantity]);
    });

    it("Should allow authorized users to get information about an inventory", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        const [previousLotIds, previousQuantities] = await inventoryManager.getInventory(owner.address);
        expect(previousLotIds).to.deep.equal([]);
        expect(previousQuantities).to.deep.equal([]);

        await inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity);

        const [lotIds, quantities] = await inventoryManager.getInventory(owner.address);
        expect(lotIds[0]).to.equal(sampleInventory.lotId);
        expect(quantities[0]).to.equal(sampleInventory.quantity);
    });

    it("Should allow authorized users to get information about their own inventory", async function () {
        const { inventoryManager, otherAccount } = await loadFixture(deployInventoryManagerWithLot);

        const [previousLotIds, previousQuantities] = await inventoryManager.connect(otherAccount).getMyInventory();
        expect(previousLotIds).to.deep.equal([]);
        expect(previousQuantities).to.deep.equal([]);

        await inventoryManager.addToInventory(otherAccount.address, sampleInventory.lotId, sampleInventory.quantity);

        const [lotIds, quantities] = await inventoryManager.connect(otherAccount).getMyInventory();
        expect(lotIds[0]).to.equal(sampleInventory.lotId);
        expect(quantities[0]).to.equal(sampleInventory.quantity);
    });
  });

  describe("Manufacturer operations", function () {
    it("Should allow manufacturer to add lot to its own inventory", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await expect(inventoryManager.addToManufacturerInventory(sampleLot.lotId)).to
          .emit(inventoryManager, "AddedToManufacturerInventory").withArgs(owner.address, sampleLot.lotId, sampleLot.LotDetails.totalQuantity);

        const [previousLotIds, previousQuantities] = await inventoryManager.getInventory(owner.address);
        expect(previousLotIds[0]).to.equal(sampleLot.lotId);
        expect(previousQuantities[0]).to.equal(sampleLot.LotDetails.totalQuantity);

        await inventoryManager.addToManufacturerInventory(sampleLot2.lotId);

        const [lotIds, quantities] = await inventoryManager.getInventory(owner.address);
        expect(lotIds[1]).to.equal(sampleLot2.lotId);
        expect(quantities[1]).to.equal(sampleLot2.LotDetails.totalQuantity);
    });
  });

  describe("Utility functions", function () {
    it("Should handle differences in arrays' sizes", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await expect(inventoryManager.hasSufficientInventory(owner.address, [sampleInventory.lotId], [sampleInventory.quantity, sampleInventory.quantity]))
            .to.be.revertedWith("Arrays size must match");
        await expect(inventoryManager.hasSufficientInventory(owner.address, [sampleInventory.lotId, sampleInventory.lotId], [sampleInventory.quantity]))
            .to.be.revertedWith("Arrays size must match");
    });

    it("Should correctly provide correct information about inventories's quantitites", async function () {
        const { inventoryManager, owner } = await loadFixture(deployInventoryManagerWithLot);

        await inventoryManager.addToInventory(owner.address, sampleInventory.lotId, sampleInventory.quantity);

        await expect(inventoryManager.hasSufficientInventory(owner.address, [sampleInventory.lotId], [sampleInventory.quantity])).
            to.not.be.reverted;
        await expect(inventoryManager.hasSufficientInventory(owner.address, [sampleInventory.lotId], [sampleInventory.quantity+1]))
            .to.be.revertedWith(`Quantity for lot ${sampleInventory.lotId} (${sampleInventory.quantity+1}) is bigger than the amount in inventory (${sampleInventory.quantity})`);
        
    });
  });

});
