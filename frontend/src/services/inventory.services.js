import { ethers, keccak256, toUtf8Bytes } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import axios from 'axios'
import { loadContract } from '@/utils/abi.config'

const contractName = 'InventoryManager'
const ENDPOINT_URL = 'http://localhost:3000/api'

// function generateDppHash(dpp) {
//   // serialize object to generate numerical hash
//   function serialize(obj) {
//     if (obj === null || obj === undefined) return ''
//     if (Array.isArray(obj)) {
//       // join array elements
//       return '[' + obj.map(serialize).join(',') + ']'
//     }
//     if (typeof obj === 'object') {
//       // sort keys to have determinism
//       const sortedKeys = Object.keys(obj).sort()
//       return '{' + sortedKeys.map((key) => `"${key}":${serialize(obj[key])}`).join(',') + '}'
//     }
//     return String(obj)
//   }

//   const serialized = serialize(dpp)
//   const hashHex = keccak256(toUtf8Bytes(serialized))
//   const numericHash = BigInt(hashHex)
//   return numericHash
// }

// async function hashString(str) {
//   const encoder = new TextEncoder()
//   const data = encoder.encode(str)
//   const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
//   const hashArray = Array.from(new Uint8Array(hashBuffer))
//   return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
// }

// async function hashDppFields(dpp) {
//   const hashedDpp = {}

//   for (const [key, value] of Object.entries(dpp)) {
//     if (typeof value === 'string') {
//       hashedDpp[key] = await hashString(value)
//     } else if (Array.isArray(value)) {
//       const joined = value.join('') // flatten to one string
//       hashedDpp[key] = await hashString(joined)
//     } else if (value != null) {
//       // fallback: hash string representation of other values
//       hashedDpp[key] = await hashString(String(value))
//     }
//     // skip undefined/null
//   }

//   return hashedDpp
// }

export async function getInventory() {

  const [abi, address] = await loadContract('InventoryManager')
  console.log(abi)

  const provider = new Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  console.log(`signer: ${await signer.getAddress()}`)

  const contract = new ethers.Contract(address, abi, signer)
  //   console.log(dppHash)
  let [lots, quantities] = await contract.getMyInventory()
  //   console.log('Inventory:', inventory)

  // TODO ottengo solo lotIds e quantities, devo chiamare "getLot"

  lots = lots.map((id) => id.toString())
  quantities = quantities.map((qt) => qt.toString())

  return { lotIds: lots, quantities: quantities }
}
