/**
 * It maps all the endpoints to the contract-info controller functions
 */

const express = require('express');
const router = express.Router();

const contract_info = require('../controllers/contract-info');

router.get('/contract=:contract', contract_info.getContractInfo); 

module.exports = router;
