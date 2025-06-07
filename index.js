/**
 * this script is to be used as a local test, it has nothing to
 * do with the web page.
 * 
 * web3 has lot of functionalities so it is impossible to test everyone of them
 * the most basic ones are tested to check correct behavior
 */

var { Web3 } = require('web3');

var web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');

async function test() {
  try {
    //check connection by fetching latest block
    const latestBlock = await web3.eth.getBlock('latest');
    console.log('Latest block:', latestBlock);

    //fetch network ID
    const networkId = await web3.eth.net.getId();
    console.log('Network ID:', networkId);

    //list all available accounts
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts:', accounts);

    //fetch balance of the first account
    if (accounts.length > 0) {
      const balance = await web3.eth.getBalance(accounts[0]);
      console.log(`Balance of ${accounts[0]}:`, web3.utils.fromWei(balance, 'ether'), 'ETH');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

test();