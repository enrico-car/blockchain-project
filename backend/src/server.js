const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors())

// Connessione a MongoDB
mongoose.connect('mongodb://mongodb:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connesso a MongoDB');
}).catch((err) => {
  console.error('❌ Errore connessione MongoDB:', err);
});

// Connessione a rete Hardhat
const provider = new ethers.JsonRpcProvider('http://hardhat:8545');

// Verifica la connessione
async function checkHardhatConnection() {
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connesso a Hardhat. Ultimo blocco: ${blockNumber}`);
    return true;
  } catch (err) {
    console.error('❌ Errore connessione Hardhat:', err.message);
    return false;
  }
}

// Ritenta la connessione con backoff
async function initializeProvider(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    if (await checkHardhatConnection()) return;
    await new Promise(res => setTimeout(res, delay * (i + 1)));
  }
  throw new Error('Impossibile connettersi a Hardhat dopo diversi tentativi');
}

app.get('/', (req, res) => {
  res.json({ message: 'Backend risponde!' })
})

// Usalo all'avvio
initializeProvider().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Avvio fallito:', err);
  process.exit(1);
});