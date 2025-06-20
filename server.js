/**
 * in order to test the web page, a server needs to be run
 * 
 * it is possible to execute this script using nodejs
 */

const path = require('path');
const port = 3000;
const express = require('express');
const app = express();
app.use(express.json());

//import routing pages
const contract_info = require('./routes/contract-info');
app.use('/contract-info', contract_info);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});