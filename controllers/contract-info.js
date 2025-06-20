/**
 * This controller will receive as a parameter the name of the contract,
 * based on this, it retrieves both abi and address of such smart contract.
 * In the case it doesn't find any corresponde (even in the case one of the two information is 
 * missing), it will return a 404 error.
 */

const path = require('path');
const fs = require('fs');

const getContractInfo = async (req, res) => {
  const contractName = req.params.contract;

  if (!contractName) {
    return res.status(400).json({ error: 'Contract name is required' });
  }

  try {
    // Read ABI
    // path builds an absolute path
    const abiPath = path.resolve(__dirname, '..', 'build', 'abi', `${contractName}.json`);
    
    if (!fs.existsSync(abiPath)) {
      return res.status(404).json({ error: 'ABI not found for contract ' + contractName });
    }
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    // Read address
    const deployedPath = path.resolve(__dirname, '..', 'deployedContracts.json');
    const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    const address = deployed[contractName];
    if (!address) {
      return res.status(404).json({ error: 'Address not found for contract ' + contractName });
    }

    // Send JSON response
    res.status(200).json({ abi, address });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
    getContractInfo
}