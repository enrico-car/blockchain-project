const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { keccak256, toUtf8Bytes, ZeroHash } = require("ethers");
const { expect } = require("chai");
const e = require("express");

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
    quantity: sampleLot.LotDetails.totalQuantity,
}

const sampleInventory2 = {
    lotId: sampleLot2.lotId,
    quantity: sampleLot2.LotDetails.totalQuantity,
}

describe("TransactionManager", function () {
  async function deployTransactionManager() {
    const [owner, manufacturer, wholesaler, pharmacy] = await ethers.getSigners();

    const CashbackToken = await ethers.getContractFactory("CashbackToken");
    const cashbackToken = await CashbackToken.deploy();
    await cashbackToken.waitForDeployment();

    const ProductManager = await ethers.getContractFactory("ProductManager");
    const productManager = await ProductManager.deploy();
    await productManager.waitForDeployment();

    const InventoryManager = await ethers.getContractFactory("InventoryManager");
    const inventoryManager = await InventoryManager.deploy(productManager.target);
    await inventoryManager.waitForDeployment();

    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    const transactionManager = await TransactionManager.deploy(productManager.target, inventoryManager.target, cashbackToken.target);
    await transactionManager.waitForDeployment();
    await transactionManager.setUserAuth(manufacturer.address, true);

    await productManager.setUserAuth(manufacturer.address, true);

    await productManager.connect(manufacturer).createProduct(sampleProduct.productId, sampleProduct.DPP);

    await productManager.connect(manufacturer).createLot(
      sampleLot.lotId, sampleLot.LotDetails.timestamp, sampleLot.LotDetails.expirationDate,
      sampleLot.LotDetails.totalQuantity, sampleLot.LotDetails.unitPrice, sampleLot.LotDetails.productId
    );
    await productManager.connect(manufacturer).createLot(
      sampleLot2.lotId, sampleLot2.LotDetails.timestamp, sampleLot2.LotDetails.expirationDate,
      sampleLot2.LotDetails.totalQuantity, sampleLot2.LotDetails.unitPrice, sampleLot2.LotDetails.productId
    );

    await inventoryManager.setManufacturerAuth(manufacturer.address, true);
    await productManager.setInventoryManager(inventoryManager.target, true);

    await transactionManager.setPharmacyAuth(pharmacy.address, true);

    await inventoryManager.connect(manufacturer).addToManufacturerInventory(sampleInventory.lotId);
    await inventoryManager.connect(manufacturer).addToManufacturerInventory(sampleInventory2.lotId);

    await cashbackToken.setMinterAuth(transactionManager.target, true);

    await inventoryManager.setUserAuth(transactionManager.target, true);

    return { transactionManager, owner, manufacturer, wholesaler, pharmacy, productManager, inventoryManager, cashbackToken };
  }

  async function deployTransactionManagerPharmacy() {
    const { transactionManager, owner, manufacturer, wholesaler, pharmacy, productManager, inventoryManager, cashbackToken } = await loadFixture(deployTransactionManager);

    // Add some inventory to the pharmacy
    await transactionManager.connect(manufacturer).proposeTransaction(pharmacy.address, [sampleInventory.lotId], [sampleInventory.quantity]);
    await transactionManager.connect(manufacturer).proposeTransaction(pharmacy.address, [sampleInventory2.lotId], [sampleInventory2.quantity]);

    const incomingTransactions = await transactionManager.connect(pharmacy).getIncomingTransactions();
    await transactionManager.connect(pharmacy).reviewTransaction(manufacturer.address, incomingTransactions[0].detailsHash, true);
    await transactionManager.connect(pharmacy).reviewTransaction(manufacturer.address, incomingTransactions[1].detailsHash, true);

    return { transactionManager, owner, manufacturer, wholesaler, pharmacy, productManager, inventoryManager, cashbackToken };
  }

  describe("Deployment", function () {
    it("Should use the correct ProductManager", async function () {
      const { transactionManager, productManager } = await loadFixture(deployTransactionManager);

      expect(await transactionManager.productManager()).to.equal(productManager.target);
    });

    it("Should use the correct InventoryManager", async function () {
      const { transactionManager, inventoryManager } = await loadFixture(deployTransactionManager);

      expect(await transactionManager.inventoryManager()).to.equal(inventoryManager.target);
    });

    it("Should use the correct CashbackToken", async function () {
      const { transactionManager, cashbackToken } = await loadFixture(deployTransactionManager);

      expect(await transactionManager.cashbackToken()).to.equal(cashbackToken.target);
    });

    it("Should set the right owner", async function () {
      const { transactionManager, owner } = await loadFixture(deployTransactionManager);

      expect(await transactionManager.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control Lists", function () {
    it("Should prevent unauthorized changes to the ACLs", async function () {
      const { transactionManager, manufacturer } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).setUserAuth(manufacturer.address, true)).to.be.reverted;
    });

    it("Should allow the owner to modify the ACLs", async function () {
      const { transactionManager, owner } = await loadFixture(deployTransactionManager);

      expect(await transactionManager.authorizedUsers(owner.address)).to.equal(false);

      await transactionManager.setUserAuth(owner.address, true);

      expect(await transactionManager.authorizedUsers(owner.address)).to.equal(true);
    });

    it("Should correctly prevent unauthorized access through ACLs", async function () {
      const { transactionManager, wholesaler } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(wholesaler).setRewardMultiplier(100))
        .to.be.revertedWith("Not authorized to use this function");
      await expect(transactionManager.connect(wholesaler).removeExpiredTransactions(5))
        .to.be.reverted;
      await expect(transactionManager.connect(wholesaler).registerSaleToCustomer([], []))
      .to.be.revertedWith("Only a pharmacy is allowed to use this function");
    });
  });

  describe("Transaction operations", function () {
    it("Should prevent transactions to self", async function () {
      const { transactionManager, manufacturer } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).proposeTransaction(manufacturer.address, [sampleInventory.lotId, sampleInventory2.lotId], [sampleInventory.quantity]))
        .to.be.revertedWith("Transactions towards self are not allowed");
    });

    it("Should prevent proposal of empty transaction", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [], []))
        .to.be.revertedWith("Cannot create transaction with empty lot list");
    });

    it("Should handle differences in arrays' sizes during the creation of a new transaction", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId, sampleInventory2.lotId], [sampleInventory.quantity]))
        .to.be.revertedWith("Arrays size must match");
      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity, sampleInventory2.quantity]))
        .to.be.revertedWith("Arrays size must match");
    });

    it("Should verify proposer lots availability during the creation of a new transaction", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity+1]))
        .to.be.reverted;
    });

    // TODO: Possiamo controllare anche i parametri degli emit (event)
    // TODO: Possiamo controllare anche i parametri delle transazioni (hash, timestamp, ecc...)
    it("Should allow users to propose a new transaction", async function () {
      const { transactionManager, inventoryManager, manufacturer, wholesaler, pharmacy } = await loadFixture(deployTransactionManager);

      const [manufacturerLotIds, manufacturerQuantities] = await inventoryManager.connect(manufacturer).getMyInventory();
      expect(manufacturerLotIds).to.deep.equal([sampleInventory.lotId, sampleInventory2.lotId]);
      expect(manufacturerQuantities).to.deep.equal([sampleInventory.quantity, sampleInventory2.quantity]);

      // Check a transaction from a new sender to a new receiver
      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]))
        .to.emit(transactionManager, "AddedTransaction"); 

      // Check the inventory of the sender after the transaction
      const [manufacturerLotIds2, manufacturerQuantities2] = await inventoryManager.connect(manufacturer).getMyInventory();
      expect(manufacturerLotIds2).to.deep.equal([sampleInventory2.lotId]);
      expect(manufacturerQuantities2).to.deep.equal([sampleInventory2.quantity]);

      // Check if the transaction is correctly added
      const pendingtransaction = await transactionManager.pendingTransactions(manufacturer.address, wholesaler.address, 0);
      expect(pendingtransaction.from).to.equal(manufacturer.address);
      expect(pendingtransaction.to).to.equal(wholesaler.address); 
      
      // Check auxiliary data structs, used for iteration
      expect(await transactionManager.senders(0)).to.equal(manufacturer.address);
      expect(await transactionManager.sendersToReceivers(manufacturer.address, 0)).to.equal(wholesaler.address);
      expect(await transactionManager.hasRelation(manufacturer.address, wholesaler.address)).to.equal(true);

      // Check another transactions from the same sender to the same receiver
      await expect(transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory2.lotId], [sampleInventory2.quantity/2]))
        .to.emit(transactionManager, "AddedTransaction"); 

      // Check the inventory of the sender after the transaction
      const [manufacturerLotIds3, manufacturerQuantities3] = await inventoryManager.connect(manufacturer).getMyInventory();
      expect(manufacturerLotIds3).to.deep.equal([sampleInventory2.lotId]);
      expect(manufacturerQuantities3).to.deep.equal([sampleInventory2.quantity/2]);
 
      // Check if the transaction is correctly added
      const pendingtransaction2 = await transactionManager.pendingTransactions(manufacturer.address, wholesaler.address, 1);
      expect(pendingtransaction2.from).to.equal(manufacturer.address);
      expect(pendingtransaction2.to).to.equal(wholesaler.address); 
      
      // Check auxiliary data structs, used for iteration
      expect(await transactionManager.senders(0)).to.equal(manufacturer.address);
      expect(await transactionManager.sendersToReceivers(manufacturer.address, 0)).to.equal(wholesaler.address);
      expect(await transactionManager.hasRelation(manufacturer.address, wholesaler.address)).to.equal(true);

      // Check transactions from the same sender to a different receiver
      await expect(transactionManager.connect(manufacturer).proposeTransaction(pharmacy.address, [sampleInventory2.lotId], [sampleInventory2.quantity/2]))
        .to.emit(transactionManager, "AddedTransaction"); 

      // Check the inventory of the sender after the transaction
      const [manufacturerLotIds4, manufacturerQuantities4] = await inventoryManager.connect(manufacturer).getMyInventory();
      expect(manufacturerLotIds4).to.deep.equal([]);
      expect(manufacturerQuantities4).to.deep.equal([]);

      // Check if the transaction is correctly added
      const pendingtransaction3 = await transactionManager.pendingTransactions(manufacturer.address, pharmacy.address, 0);
      expect(pendingtransaction3.from).to.equal(manufacturer.address);
      expect(pendingtransaction3.to).to.equal(pharmacy.address); 
      
      // Check auxiliary data structs, used for iteration
      expect(await transactionManager.senders(0)).to.equal(manufacturer.address);
      expect(await transactionManager.sendersToReceivers(manufacturer.address, 1)).to.equal(pharmacy.address);
      expect(await transactionManager.hasRelation(manufacturer.address, pharmacy.address)).to.equal(true);
    });

    it("Should handle reviews for not existing transactions", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(wholesaler).reviewTransaction(manufacturer.address, ZeroHash, true))
        .to.be.revertedWith("Transaction not found!");

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      await expect(transactionManager.connect(wholesaler).reviewTransaction(manufacturer.address, ZeroHash, true))
        .to.be.revertedWith("Transaction not found!");
    });

    it("Should allow users to retrieve incoming transactions", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);
      
      const pendingtransaction = await transactionManager.connect(wholesaler).getIncomingTransactions();
      expect(pendingtransaction).to.have.lengthOf(1);
      expect(pendingtransaction[0].from).to.equal(manufacturer.address);
      expect(pendingtransaction[0].to).to.equal(wholesaler.address);
      expect(pendingtransaction[0].lotIds).to.deep.equal([(sampleInventory.lotId)]);
      expect(pendingtransaction[0].quantities).to.deep.equal([sampleInventory.quantity]);
    });

    it("Should allow users to retrieve outgoing transactions", async function () {
      const { transactionManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      const pendingtransaction = await transactionManager.connect(manufacturer).getOutgoingTransactions();
      expect(pendingtransaction).to.have.lengthOf(1);
      expect(pendingtransaction[0].from).to.equal(manufacturer.address);
      expect(pendingtransaction[0].to).to.equal(wholesaler.address);
      expect(pendingtransaction[0].lotIds).to.deep.equal([(sampleInventory.lotId)]);
      expect(pendingtransaction[0].quantities).to.deep.equal([sampleInventory.quantity]);
    });

    it("Should allow users to accept incoming transactions", async function () {
      const { transactionManager, inventoryManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      const incomingTransactions = await transactionManager.connect(wholesaler).getIncomingTransactions();

      // Check the inventory of the wholesaler before accepting the transaction
      const [wholesalerLotIds, wholesalerQuantities] = await inventoryManager.connect(wholesaler).getMyInventory();
      expect(wholesalerLotIds).to.deep.equal([]);
      expect(wholesalerQuantities).to.deep.equal([]);

      // Check for the event emitted when accepting a transaction
      await expect(transactionManager.connect(wholesaler).reviewTransaction(manufacturer.address, incomingTransactions[0].detailsHash, true))
        .to.emit(transactionManager, "AcceptedTransaction")
        .withArgs(manufacturer.address, wholesaler.address, incomingTransactions[0].detailsHash, incomingTransactions[0]);
      
      // Check the inventory of the wholesaler after accepting the transaction
      const [wholesalerLotIds2, wholesalerQuantities2] = await inventoryManager.connect(wholesaler).getMyInventory();
      expect(wholesalerLotIds2).to.deep.equal([sampleInventory.lotId]);
      expect(wholesalerQuantities2).to.deep.equal([sampleInventory.quantity]);
    });

    it("Should allow users to decline incoming transactions", async function () {
      const { transactionManager, inventoryManager, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      const incomingTransactions = await transactionManager.connect(wholesaler).getIncomingTransactions();

      // Check the inventory of the wholesaler before declining the transaction
      const [wholesalerLotIds, wholesalerQuantities] = await inventoryManager.connect(wholesaler).getMyInventory();
      expect(wholesalerLotIds).to.deep.equal([]);
      expect(wholesalerQuantities).to.deep.equal([]);

      // Check for the event emitted when declining a transaction
      await expect(transactionManager.connect(wholesaler).reviewTransaction(manufacturer.address, incomingTransactions[0].detailsHash, false))
        .to.emit(transactionManager, "RejectedTransaction")
        .withArgs(manufacturer.address, wholesaler.address, incomingTransactions[0].detailsHash, incomingTransactions[0]);
      
      // Check the inventory of the wholesaler after declining the transaction, should remain unchanged
      const [wholesalerLotIds2, wholesalerQuantities2] = await inventoryManager.connect(wholesaler).getMyInventory();
      expect(wholesalerLotIds2).to.deep.equal([]);
      expect(wholesalerQuantities2).to.deep.equal([]);

      // Check the inventory of the manufacturer after declining the transaction, should get back the lots involved in the transaction
      const [manufacturerLotIds, manufacturerQuantities] = await inventoryManager.connect(manufacturer).getMyInventory();
      await expect(manufacturerLotIds.map(x => x.toString())).to.have.members([
        sampleInventory.lotId.toString(),
        sampleInventory2.lotId.toString()
      ]);

      await expect(manufacturerQuantities.map(x => x.toString())).to.have.members([
        sampleInventory.quantity.toString(),
        sampleInventory2.quantity.toString()
      ]);
    });
  });

  describe("Sale to final customer", function () {
    it("Should prevent empty sale", async function () {
      const { transactionManager, pharmacy } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([], []))
        .to.be.revertedWith("Cannot register a sale with empty lot list");
    });

    it("Should handle differences in arrays' sizes during the sale", async function () {
      const { transactionManager, pharmacy } = await loadFixture(deployTransactionManagerPharmacy);

      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([sampleInventory.lotId, sampleInventory2.lotId], [sampleInventory.quantity]))
        .to.be.revertedWith("Arrays size must match");
      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([sampleInventory.lotId], [sampleInventory.quantity, sampleInventory2.quantity]))
        .to.be.revertedWith("Arrays size must match");
    });

    it("Should verify lots availability during the sale", async function () {
      const { transactionManager, pharmacy } = await loadFixture(deployTransactionManagerPharmacy);

      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([sampleInventory.lotId], [sampleInventory.quantity+1]))
        .to.be.reverted;
    });

    // TODO: Possiamo controllare anche i parametri degli emit (event)
    // TODO: Possiamo controllare anche i parametri delle transazioni (hash, timestamp, ecc...)
    it("Should allow a sale to the final customer", async function () {
      const { transactionManager, inventoryManager, pharmacy } = await loadFixture(deployTransactionManagerPharmacy);

      // Compute the value of the sale
      const sampleInventory2Value = sampleInventory2.quantity * sampleLot2.LotDetails.unitPrice;

      // Check if the function emits the correct event
      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([sampleInventory2.lotId], [sampleInventory2.quantity]))
        .to.emit(transactionManager, "SaleToCustomer").withArgs(pharmacy.address, [sampleInventory2.lotId], [sampleInventory2.quantity], sampleInventory2Value);

      // Check the inventory of the seller after the transaction
      const [pharmacyLotIds, pharmacyQuantities] = await inventoryManager.connect(pharmacy).getMyInventory();
      expect(pharmacyLotIds).to.deep.equal([sampleInventory.lotId]);
      expect(pharmacyQuantities).to.deep.equal([sampleInventory.quantity]);

      // Compute the value of the sale
      const sampleInventoryValue = sampleInventory.quantity * sampleLot.LotDetails.unitPrice;

      // Check if the function emits the correct event
      await expect(transactionManager.connect(pharmacy).registerSaleToCustomer([sampleInventory.lotId], [sampleInventory.quantity]))
        .to.emit(transactionManager, "SaleToCustomer").withArgs(pharmacy.address, [sampleInventory.lotId], [sampleInventory.quantity], sampleInventoryValue);

      // Check the inventory of the seller after the transaction
      const [pharmacyLotIds2, pharmacyQuantities2] = await inventoryManager.connect(pharmacy).getMyInventory();
      expect(pharmacyLotIds2).to.deep.equal([]);
      expect(pharmacyQuantities2).to.deep.equal([]);
    });
  })

  describe("Reward operations", function () { 
    it("Should prevent value higher than 100% for the reward multiplier", async function () {
      const { transactionManager, manufacturer } = await loadFixture(deployTransactionManager);

      await expect(transactionManager.connect(manufacturer).setRewardMultiplier(10001))
        .to.be.revertedWith("Multiplier must be lower than 100% (i.e. value lower than 10000)");
    });

    it("Should allow the owner to set the reward multiplier", async function () {
      const { transactionManager, manufacturer } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).setRewardMultiplier(100);
      expect(await transactionManager.rewardMultiplier()).to.equal(100);

      await transactionManager.connect(manufacturer).setRewardMultiplier(200);
      expect(await transactionManager.rewardMultiplier()).to.equal(200);
    });

    it("Should reward the sender and receiver of a transaction with the correct amount of cashback tokens", async function () {
      const { transactionManager, cashbackToken, manufacturer, wholesaler } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      const incomingTransactions = await transactionManager.connect(wholesaler).getIncomingTransactions();
      await transactionManager.connect(wholesaler).reviewTransaction(manufacturer.address, incomingTransactions[0].detailsHash, true);

      const totalPrice = sampleInventory.quantity * sampleLot.LotDetails.unitPrice;

      await transactionManager.connect(manufacturer).setRewardMultiplier(100);
      const rewardMultiplier = await transactionManager.rewardMultiplier();

      const expectedReward = BigInt(10 ** 18) * ((BigInt(totalPrice) / BigInt(100)) * (BigInt(rewardMultiplier) / BigInt(100))) / BigInt(100);
      expect(await cashbackToken.balanceOf(manufacturer.address)).to.be.equal((expectedReward));
      expect(await cashbackToken.balanceOf(wholesaler.address)).to.be.equal((expectedReward));
    });
  });

  describe("Utility functions", function () {
    it("Should remove old pending transactions", async function () {
      const { transactionManager, manufacturer, wholesaler, pharmacy } = await loadFixture(deployTransactionManager);

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory.lotId], [sampleInventory.quantity]);

      await network.provider.send("evm_increaseTime", [60]);  // Advance time by some seconds
      await network.provider.send("evm_mine");                // Mine a new block

      await transactionManager.connect(manufacturer).proposeTransaction(wholesaler.address, [sampleInventory2.lotId], [sampleInventory2.quantity/2]);

      await network.provider.send("evm_increaseTime", [60]);  // Advance time by some seconds
      await network.provider.send("evm_mine");                // Mine a new block

      await transactionManager.connect(manufacturer).proposeTransaction(pharmacy.address, [sampleInventory2.lotId], [sampleInventory2.quantity/2]);

      expect(await transactionManager.connect(wholesaler).getIncomingTransactions()).to.have.lengthOf(2);

      await expect(transactionManager.removeExpiredTransactions(120)) // Remove transactions older than 120 seconds --> Only the first transaction should be removed
        .to.emit(transactionManager, "RemovedTransaction"); 
      expect(await transactionManager.connect(wholesaler).getIncomingTransactions()).to.have.lengthOf(1);

      await expect(transactionManager.removeExpiredTransactions(60)) // Remove transactions older than 60 seconds --> Second transaction should be removed
        .to.emit(transactionManager, "RemovedTransaction"); 
      expect(await transactionManager.connect(wholesaler).getIncomingTransactions()).to.have.lengthOf(0);

      await expect(transactionManager.removeExpiredTransactions(1)) // Remove transactions older than 1 seconds --> All transactions should be removed
        .to.emit(transactionManager, "RemovedTransaction"); 
      expect(await transactionManager.connect(wholesaler).getIncomingTransactions()).to.have.lengthOf(0);
    });
  });
});