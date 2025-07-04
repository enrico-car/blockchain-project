const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers, upgrades } = require("hardhat");

// Il proprietario del contratto e' il primo wallet della lista
module.exports = buildModule("DeployModule", (m) => {

  const deployer = m.getAccount(0);
  console.log("Deployer address:", deployer);

  const manufacturer = m.getAccount(1);
  console.log("Manufacturer address:", manufacturer);

  const pharmacies = [];
  for (let i = 15; i < 20; i++) {
    pharmacies.push(m.getAccount(i));
  }
  console.log("Pharmacies addresses:", pharmacies);

  // Cashback token and handler
  const token = m.contract("CashbackToken");

  // https://github.com/NomicFoundation/hardhat-ignition/issues/788
  const implementation = m.contract('CashbackHandlerUpgradable');

  const initData = m.encodeFunctionCall(
    implementation,
    'initialize',
    [token]
  );

  const proxy = m.contract('ERC1967Proxy', [implementation, initData]);

  const handler = m.contractAt('CashbackHandlerUpgradable', proxy, {
    id: 'CashbackHandlerInstance'
  });

  m.call(token, "setBurnerAuth", [handler, true]);

  // Product manager
  const productManager = m.contract("ProductManager");

  // Authorize the manufactoring house to create products and lots (Creation and removal of lots and products)
  m.call(productManager, "setManufacturerAuth", [
    manufacturer, 
    true,
  ]);

  // Inventory manager
  const inventoryManager = m.contract("InventoryManager", [productManager]);

  m.call(productManager, "setInventoryManager", [inventoryManager, true]);

  // Give permission to the manufacturer to add lots to its own inventory
  m.call(inventoryManager, "setManufacturerAuth", [
    manufacturer,
    true,
  ]);

  // Transaction manager
  const transactionManager = m.contract("TransactionManager", [
    productManager,
    inventoryManager,
    token,
  ]);

  // get Mint authorization to Transactin manager
  m.call(token, "setMinterAuth", [transactionManager, true]);

  m.call(inventoryManager, "setTransactionManager", [transactionManager, true]);

  m.call(transactionManager, "setManufacturerAuth", [
    manufacturer, 
    true,
  ]);

  for (let i = 0; i < pharmacies.length; i++) {
    m.call(transactionManager, "setPharmacyAuth", [pharmacies[i], true], {
      id: `setPharmacyAuth_${i}`,
    });
  }

  m.call(token, "setMinterAuth", [deployer, true], { id: "authDeployerAsMinter" });
  var amount = 800 * 10 ** 18;
  m.call(token, "mint", [manufacturer, amount.toString()], { id: "mintTokens" });

  return {
    CashbackToken: token,
    CashbackHandler: handler,
    ProductManager: productManager,
    InventoryManager: inventoryManager,
    TransactionManager: transactionManager,
    ERC1967Proxy: proxy,
  };
});
