const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Il proprietario del contratto e' il primo wallet della lista
module.exports = buildModule("DeployModule", (m) => {
  const token = m.contract("CashbackToken");

  const handler = m.contract("CashbackHandler", [token]);

  m.call(token, "setBurnerAuth", [handler, true]);

  // Product manager
  const productManager = m.contract("ProductManager");

  // Authorize the manufactoring house to create products and lots (Creation and removal of lots and products)
  m.call(productManager, "setUserAuth", [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Change with env
    true,
  ]);
  // Inventory manager
  const inventoryManager = m.contract("InventoryManager", [productManager]);
  // Give permission to the manufacturer to add lots to its own inventory
  m.call(inventoryManager, "setManufacturerAuth", [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    true,
  ]);

  m.call(productManager, "setInventoryManager", [inventoryManager, true]);

  // Transaction manager
  const transactionManager = m.contract("TransactionManager", [
    productManager,
    inventoryManager,
    token,
  ]);

  // get Mint authorization to Transactin manager
  m.call(token, "setMinterAuth", [transactionManager, true]);

  m.call(token, "setMinterAuth", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", true], { id: "authDeployerAsMinter" });
  var amount = 800;
  m.call(token, "mint", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", amount.toString()], { id: "mintTokens" });

  // Give the transactionManager permission to handle users inventory
  m.call(inventoryManager, "setUserAuth", [transactionManager, true]);

  return {
    CashbackToken: token,
    CashbackHandler: handler,
    ProductManager: productManager,
    InventoryManager: inventoryManager,
    TransactionManager: transactionManager,
  };
});
