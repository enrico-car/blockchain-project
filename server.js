/**
 * in order to test the web page, a server needs to be run
 * 
 * it is possible to execute this script using nodejs
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

/**
 * add an endpoint to retrieve the information about a specific contract
 * this will return both abi and address of the contract so that the frontend page
 * can initialize an instance to interact with it
 */
app.get('/api/contract', (req, res) => {
  const contractName = req.query.name;
  if (!contractName) {
    return res.status(400).json({ error: 'Contract name is required' });
  }

  try {
    // Read ABI
    const abiPath = path.join(__dirname, 'build', 'abi', `${contractName}.json`);
    if (!fs.existsSync(abiPath)) {
      return res.status(404).json({ error: 'ABI not found for contract ' + contractName });
    }
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    // Read address
    const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, 'deployedContracts.json'), 'utf8'));
    const address = deployed[contractName];
    if (!address) {
      return res.status(404).json({ error: 'Address not found for contract ' + contractName });
    }

    // Send JSON response
    res.json({ abi, address });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
