import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import axios from 'axios'

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

    const contract = new ethers.Contract(address, abi, provider)

    const receipt = await contract.getIncomingTransactions()

    console.log(receipt)

    return receipt
  } catch (err) {
    console.error('Error in getIncomingTransactions:', err)
    throw err
  }
}

export async function getOutgoingTransactions() {
  try {
    //FIXME: put a .env for the endpoint
    const response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`)
    const { abi, address } = response.data

    const provider = new Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)

    const receipt = await contract.getOutgoingTransactions()

    console.log(receipt)

    return receipt
  } catch (err) {
    console.error('Error in getOutgoingTransactions:', err)
    throw err
  }
}
