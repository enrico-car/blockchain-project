const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Il proprietario del contratto e' il primo wallet della lista
module.exports = buildModule("CashbackModule", (m) => {
  const token = m.contract("CashbackToken");

  const handler = m.contract("CashbackHandler", [token]);

  m.call(token, "setBurnerAuth", [handler, true]);

  return { token, handler };
});