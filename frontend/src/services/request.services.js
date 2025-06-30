import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import axios from 'axios'
import { loadContract } from '@/utils/abi.config'

const contractName = 'TransactionManager'
const ENDPOINT_URL = 'http://localhost:3000/api'

/**
 * the function allows the proposing of a new transaction
 * @param {*} walletAddress the address of the user that will "receive" the package
 * @param {*} lotIds the identifiers of the lot
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
    //FIXME: put a .env for the endpoint
    const response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`)
    const { abi, address } = response.data

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    console.log(`signer: ${await signer.getAddress()}`)

    const contract = new ethers.Contract(address, abi, signer)
    const tx = await contract.proposeTransaction(walletAddress, lotIds, quantities)
    console.log(`Transaction submitted: ${tx.hash}`)

    const receipt = await tx.wait()
    console.log(receipt)
    return receipt
  } catch (err) {
    console.error('Error in proposeTransaction:', err)
    throw err
  }
}

export async function getIncomingTransactions() {
  try {
    //FIXME: put a .env for the endpoint
    const response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`)
    const { abi, address } = response.data

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.getIncomingTransactions()

    console.log(receipt)

    const formatted = receipt.map(transaction => {
      return {
        from:String(transaction[0]),
        to:String(transaction[1]),
        lotIds: transaction[2], // TODO mappare meglio
        quantities: transaction[3],
        timestamp: parseInt(transaction[4]),
        detailsHash: String(transaction[5])
      }
    })
    // console.log(formatted)

    return formatted
  } catch (err) {
    console.error('Error in getIncomingTransactions:', err)
    throw err
  }
}

export async function getOutgoingTransactions() {
  try {
    //FIXME: put a .env for the endpoint
    // const response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`)
    // const { abi, address } = response.data
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.getOutgoingTransactions()


    // TODO effettuare dei controlli dul risultato di ritorno
    // from, to, {prodId}, {qt}, timestamp, detailsHash
    console.log(receipt)

    const formatted = receipt.map(transaction => {
      return {
        from:String(transaction[0]),
        to:String(transaction[1]),
        lotIds: transaction[2], // TODO mappare meglio
        quantities: transaction[3],
        timestamp: parseInt(transaction[4]),
        detailsHash: String(transaction[5])
      }
    })
    // console.log(formatted)

    return formatted
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}

export async function respondToTransactionRequest(from, detailsHash, response) {

  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.reviewTransaction(from, detailsHash, response)

    // TODO effettuare dei controlli dul risultato di ritorno
    // from, to, {prodId}, {qt}, timestamp, detailsHash
    // console.log(receipt)

    return receipt
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}

export async function registerSaleToCustomer(lotIds, quantities) {

  try {
    const [ abi, address ] = await loadContract("TransactionManager")

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.registerSaleToCustomer(lotIds, quantities)

    return receipt
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}

