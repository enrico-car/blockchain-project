import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { loadContract } from '@/utils/abi.config'

/**
 * the function allows the proposing of a new transaction
 * @param {*} walletAddress the address of the user that will "receive" the package
 * @param {*} quantities the number of boxes to send from such lot
 * @returns the confirmation of the transaction or an error to catch
 */
export async function proposeTransaction(walletAddress, entries) {
  const lotIds = entries.map(e => e.lotId);
  const quantities = entries.map(e => e.quantities);

  if (!ethers.isAddress(walletAddress)) {
    throw new Error('Invalid wallet address')
  }

  if (!Array.isArray(lotIds) || lotIds.some(id => isNaN(Number(id)))) {
    throw new Error('Invalid lot IDs');
  }

  if (!Array.isArray(quantities) || quantities.some(q => isNaN(Number(q)))) {
    throw new Error('Invalid quantities');
  }

  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)
    const tx = await contract.proposeTransaction(walletAddress, lotIds, quantities, {gasPrice: 0 })

    const receipt = await tx.wait()
    return receipt
  } catch (err) {
    console.error('Error in proposeTransaction:', err)
    throw err
  }
}

/**
 * Fetches the incoming transactions from blockchain.
 * 
 * @returns {Promise<Array<{
*   from: string,           // Sender address
*   to: string,             // Recipient address
*   lotIds: number[],       // Array of lot IDs involved in the transaction
*   quantities: number[],   // Array of quantities corresponding to each lot ID
*   timestamp: number,      // Unix timestamp of the transaction
*   detailsHash: string     // Hash of the transaction details
* }>>} A promise that resolves to an array of incoming transaction.
*/
export async function getIncomingTransactions() {
  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.getIncomingTransactions({gasPrice: 0 })

    const formatted = receipt.map(transaction => {
      return {
        from:String(transaction[0]),
        to:String(transaction[1]),
        lotIds: transaction[2],
        quantities: transaction[3],
        timestamp: parseInt(transaction[4]),
        detailsHash: String(transaction[5])
      }
    })

    return formatted
  } catch (err) {
    console.error('Error in getIncomingTransactions:', err)
    throw err
  }
}

/**
 * Fetches the outgoing transactions from blockchain.
 * 
 * @returns {Promise<Array<{
*   from: string,           // Sender address
*   to: string,             // Recipient address
*   lotIds: number[],       // Array of lot IDs involved in the transaction
*   quantities: number[],   // Array of quantities corresponding to each lot ID
*   timestamp: number,      // Unix timestamp of the transaction
*   detailsHash: string     // Hash of the transaction details
* }>>} A promise that resolves to an array of outgoing transactions.
*/
export async function getOutgoingTransactions() {
  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.getOutgoingTransactions({gasPrice: 0 })

    const formatted = receipt.map(transaction => {
      return {
        from:String(transaction[0]),
        to:String(transaction[1]),
        lotIds: transaction[2],
        quantities: transaction[3],
        timestamp: parseInt(transaction[4]),
        detailsHash: String(transaction[5])
      }
    })

    return formatted
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}


/**
 * Sends a response to a transaction request on the blockchain.
 * 
 * @param {string} from - The address of the sender of the transaction request.
 * @param {string} detailsHash - The hash of the transaction details.
 * @param {boolean} response - The response to the transaction request (e.g., approve or reject).
 * 
 * @returns {Promise<ethers.ContractReceipt>} A promise that resolves to the transaction receipt.
 */
export async function respondToTransactionRequest(from, detailsHash, response) {

  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.reviewTransaction(from, detailsHash, response,{gasPrice: 0 })

    return receipt
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}

/**
 * Registers a sale to a customer on the blockchain.
 * 
 * @param {number[]} lotIds - Array of lot IDs involved in the sale.
 * @param {number[]} quantities - Array of quantities corresponding to each lot ID.
 * 
 * @returns {Promise<ethers.ContractReceipt>} A promise that resolves to the transaction receipt.
 */
export async function registerSaleToCustomer(lotIds, quantities) {

  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.registerSaleToCustomer(lotIds, quantities,{gasPrice: 0 })

    return receipt
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}

