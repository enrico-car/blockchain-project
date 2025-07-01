const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Il proprietario del contratto e' il primo wallet della lista
module.exports = buildModule("DeployModule", (m) => {

  const manufacturer = m.getAccount(0);
  console.log("Manufacturer address:", manufacturer);
  const pharmacies = [];
  for (let i = 15; i < 20; i++) {
    pharmacies.push(m.getAccount(i));
  }
  console.log("Pharmacies addresses:", pharmacies);

  const token = m.contract("CashbackToken");

  const handler = m.contract("CashbackHandler", [token]);

  m.call(token, "setBurnerAuth", [handler, true]);

  // Product manager
  const productManager = m.contract("ProductManager");

  // Authorize the manufactoring house to create products and lots (Creation and removal of lots and products)
  m.call(productManager, "setUserAuth", [
    manufacturer, // Change with env
    true,
  ]);
  // Inventory manager
  const inventoryManager = m.contract("InventoryManager", [productManager]);
  // Give permission to the manufacturer to add lots to its own inventory
  m.call(inventoryManager, "setManufacturerAuth", [
    manufacturer,
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

  m.call(transactionManager, "setUserAuth", [
    manufacturer, // Change with env
    true,
  ]);

  m.call(token, "setMinterAuth", [manufacturer, true], { id: "authDeployerAsMinter" });
  var amount = 800 * 10 ** 18;
  m.call(token, "mint", [manufacturer, amount.toString()], { id: "mintTokens" });

  for (let i = 0; i < pharmacies.length; i++) {
    m.call(transactionManager, "setPharmacyAuth", [pharmacies[i], true], {
      id: `setPharmacyAuth_${i}`,
    });
  }

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
