import Lock from '../utils/abis/Lock.json'
import CashbackTokenABI from '@/utils/abis/CashbackToken.json'
import CashbackHandlerABI from '@/utils/abis/CashbackHandler.json'
import ProductManager from '@/utils/abis/ProductManager.json'

import { BrowserProvider, Contract, parseEther, formatEther, parseUnits } from 'ethers'
import {
  CASHBACK_HANDLER_ADDRESS,
  CASHBACK_TOKEN_ADDRESS,
  CONTRACT_ADDRESS,
  PRODUCT_MANAGER,
} from '../utils/constants'

// Module-level variables to store provider, signer, and contract
let provider
let signer
let contract
let token
let handler
let balance

// Function to initialize the provider, signer, and contract
// TODO creare un bottone di login invece di automatizzarlo?
// const initialize = async () => {
//   if (typeof window.ethereum !== 'undefined') {
//     provider = new BrowserProvider(window.ethereum)
//     signer = await provider.getSigner()
//     // console.log('SIGNER: ', signer)
//     //Lock contract
//     contract = new Contract(CONTRACT_ADDRESS, Lock.abi, signer)
//     // console.log('Lock => ', contract)
//     // Cashback Token
//     token = new Contract(CASHBACK_TOKEN_ADDRESS, CashbackTokenABI.abi, signer)
//     // console.log('Token => ', token)
//     // Cashback Handler
//     handler = new Contract(CASHBACK_HANDLER_ADDRESS, CashbackHandlerABI.abi, signer)
//     // console.log('Handler => ', handler)
//   } else {
//     console.error('Please install MetaMask!')
//   }
// }

// Initialize once when the module is loaded
// initialize()

export const initialize = async () => {
  if (typeof window.ethereum !== 'undefined') {
    provider = new BrowserProvider(window.ethereum)
    // TODO definire qui il signer?
  }
}

// Function to request single account
export const requestAccount = async () => {
  try {
    const accounts = await provider.send('eth_requestAccounts', [])
    return accounts[0] // Return the first account
  } catch (error) {
    console.error('Error requesting account:', error.message)
    return null
  }
}
// // Function to get contract balance in ETH
export const getContractBalanceInETH = async () => {
  const balanceWei = await provider.getBalance(CONTRACT_ADDRESS)
  const balanceEth = formatEther(balanceWei) // Convert Wei to ETH string
  return balanceEth // Convert ETH string to number
}

export const getTokenBalance = async () => {
  return await token.balanceOf(signer)
}

export const approveTokenRedeem = async () => {
  const amount = parseUnits('100', 18)
  await token.approve(handler, amount)
  await handler.redeem_cashback()
  balance = await token.balanceOf(signer)
}

// Show the Incoming pending requests
export const getInPendingRequests = async () => {}

// Show the Outgoing pending requests
export const getOutPendingRequests = async () => {}

// Inputs => productName (string), materials (string)
export const createProduct = async () => {
  // console.log('Create product')

  // TODO im doing this because after page refrash the initialie variables disappear
  if (typeof window.ethereum !== 'undefined') provider = new BrowserProvider(window.ethereum)
  signer = await provider.getSigner()

  // TODO define it only one time at the app login
  const productManagerContract = new Contract(PRODUCT_MANAGER, ProductManager.abi, signer)

  try {
    await productManagerContract.createProduct(1, ['Prod1', 'Material'])
  } catch (error) {
    console.log(error.reason)
  }
}

// TODO How can we defne the right id?
// Inputs => id?, expirrationDate (string), totalQuantity (int), unitPrice (int with two decimals), productId (int)
export const createLot = async () => {
  // console.log('Create lot')

  // TODO im doing this because after page refrash the initialie variables disappear
  if (typeof window.ethereum !== 'undefined') provider = new BrowserProvider(window.ethereum)
  signer = await provider.getSigner()

  // TODO define it only one time at the app login
  const productManagerContract = new Contract(PRODUCT_MANAGER, ProductManager.abi, signer)

  try {
    await productManagerContract.createLot(1, ['01/01/0001', 10, 10000, 1])
  } catch (error) {
    console.log(error.reason)
  }
}

// // Function to deposit funds to the contract
// export const depositFund = async (depositValue) => {
//   const ethValue = parseEther(depositValue)
//   const deposit = await contract.deposit({ value: ethValue })
//   await deposit.wait()
// }

// // Function to withdraw funds from the contract
// export const withdrawFund = async () => {
//   const withdrawTx = await contract.withdraw()
//   await withdrawTx.wait()
//   console.log('Withdrawal successful!')
// }
