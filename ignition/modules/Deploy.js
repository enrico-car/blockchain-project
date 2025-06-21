const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Il proprietario del contratto e' il primo wallet della lista
module.exports = buildModule("DeployModule", (m) => {
  const token = m.contract("CashbackToken");

  const handler = m.contract("CashbackHandler", [token]);

  m.call(token, "setBurnerAuth", [handler, true]);

  // Product manager
  const productManager = m.contract("ProductManager");

  // Authorize the manufactoring house to create products and lots
  m.call(productManager, "setUserAuth", [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Change with env
    true,
  ]);

  // Inventory manager
  const inventoryManager = m.contract("InventoryManager", [productManager]);

  // Transaction manager
  const transactionManager = m.contract("TransactionManager", [
    productManager,
    inventoryManager,
    token,
  ]);
  // get Mint authorization to Transactin manager
  m.call(token, "setMinterAuth", [transactionManager, true]);
  // ????
  m.call(inventoryManager, "setManufacturerAuth", [transactionManager, true]);

  return { token, handler };
});
