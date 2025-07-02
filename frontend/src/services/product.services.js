import { ethers, keccak256, toUtf8Bytes } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import axios from 'axios'
import { loadContract } from '@/utils/abi.config'

const contractName = 'ProductManager'
const ENDPOINT_URL = 'http://localhost:3000/api'


function generateIdFromObject(dpp) {
  // serialize object to generate numerical hash
  function serialize(obj) {
    if (obj === null || obj === undefined) return ''
    if (Array.isArray(obj)) {
      // join array elements
      return '[' + obj.map(serialize).join(',') + ']'
    }
    if (typeof obj === 'object') {
      // sort keys to have determinism
      const sortedKeys = Object.keys(obj).sort()
      return '{' + sortedKeys.map((key) => `"${key}":${serialize(obj[key])}`).join(',') + '}'
    }
    return String(obj)
  }

  const serialized = serialize(dpp)
  const hashHex = keccak256(toUtf8Bytes(serialized))
  const numericHash = BigInt(hashHex)
  return numericHash
}

// Return the input object with all the values Hashed
// export function hashObjectDetails(obj) {
//   const serialize = v =>
//     v === null || v === undefined
//       ? ''
//       : Array.isArray(v)
//         ? `[${v.map(serialize).join(',')}]`
//         : typeof v === 'object'
//           ? `{${Object.keys(v).sort().map(k => `"${k}":${serialize(v[k])}`).join(',')}}`
//           : String(v)

//   const hashField = v => {
//     if (typeof v === 'object') {
//       return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, hashField(val)]))
//     }
//     return BigInt(keccak256(toUtf8Bytes(serialize(v))))
//   }

//   return hashField(obj)
// }

export function base64DataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/data:(.*);base64/)[1]
  const binary = atob(base64)
  const byteArray = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    byteArray[i] = binary.charCodeAt(i)
  }

  return new File([byteArray], filename, { type: mime })
}


// Return the input dpp object but with all the values hashed
async function hashDppFields(dpp) {
  const fields = [
    'productIdentification',
    'materials',
    'design',
    'specifications',
    'lifecycle',
    'installation_maintenance',
    'composition',
    'microplastics',
    'env_impact',
    'transport_packaging',
    'sustainability',
    'maintenance',
    'warranty',
    'energy_recovery',
    'substance_of_concern'
  ];

  const hashedDpp = {};

  for (const field of fields) {
    const value = dpp[field];

    if (value === undefined || value === null || value === '') {
      hashedDpp[field] = 0n;
    } else {
      let toHash;
      if (typeof value === 'string') {
        toHash = value;
      } else if (Array.isArray(value)) {
        toHash = value.join('');
      } else {
        toHash = String(value);
      }

      hashedDpp[field] = BigInt(keccak256(toUtf8Bytes(toHash))) 
    }
  }

  return hashedDpp;
}


/**
 * Creates a new product on blockchain.
 * 
 * @param {Object} dpp - The product Dpp data.
 */
export async function createProduct(dpp) {
  try {
    //generate numerical hash based on dpp fields
    const numericHash = generateIdFromObject(dpp)

    //hash every single field of the dpp before storing it into the blockchain
    var dppHash = await hashDppFields(dpp)

    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)
    const tx = await contract.createProduct(numericHash, dppHash)
    const receipt = await tx.wait()

    //if blockchain ok, save on database
    dpp.id = numericHash.toString()

    const formData = new FormData()

    for (const [key, value] of Object.entries(dpp)) {
      if (key === 'image' && value) {
        // image should be a File or Blob object
        formData.append('image', value)
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value)) // stringify arrays
      } else if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    }

    // Post formData with image to backend
    let response = await axios.post(`${ENDPOINT_URL}/product/create`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    console.log('Saved in database')
  } catch (err) {
    console.log('Error in createProduct: ', err)
    throw err
  }
}

/**
 * Remove a product from blockchain.
 * 
 * @param {Object} dpp - The product Dpp data.
 */
export async function removeProduct(dpp) {
  try {
    //generate numerical hash based on dpp fields
    const numericHash = generateIdFromObject(dpp)

    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)
    const tx = await contract.removeProduct(numericHash)

    const receipt = await tx.wait()

    //if blockchain ok, delete also from database
    let response = await axios.delete(`${ENDPOINT_URL}/product/delete/${numericHash}`)
    console.log('Deleted from database')
  } catch (err) {
    console.log('Error in createProduct: ', err)
    throw err
  }
}


/**
 * Fetches a product's hashed dpp content from the blockchain by its ID.
 * 
 * @param {number|string} id - The ID of the product to fetch.
 * 
 * @returns {Promise<{ product: string }>} A promise that resolves to an object containing the hashed product content.
 */
export async function getProduct(id) {
  try {
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)

    let product = await contract.getProduct(id)

    // Returns only the product dpp Hashed content
    return { product: product[0].toString() }
  } catch (err) {
    console.log('Error in getProduct: ', err)
    throw err
  }
}

/**
 * Fetches all products from the blockchain.
 */
export async function getAllProducts() {
  try {
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)

    let [ids, products] = await contract.getAllProducts()

    ids = ids.map((id) => id.toString())
    products = products.map((details) => details.toString())

    return { ids: ids, products: products }
  } catch (err) {
    console.log('Error in getProduct: ', err)
  }
}

// Get all products from MongoDb
export async function getAllDbProducts() {
  try {
    let response = await axios.get(`${ENDPOINT_URL}/product/all`)
    return response.data.products
  } catch (error) { 
    console.log(error)
  }
}

/**
 * Creates a new product lot on the blockchain and adds it to the manufacturer's inventory.
 * 
 * @param {Object} lotDetails - Details of the product lot.
 * @returns {Promise<void>} A promise that resolves when the transactions are complited.
 */
export async function createProductLot(lotDetails) {
  try {
    //generate numerical hash based on dpp fields
    const lotId = generateIdFromObject(lotDetails)

    // Recupero ABI e address del contratto del prodotto
    const [productAbi, productAddress] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const productContract = new ethers.Contract(productAddress, productAbi, signer)
    const tx = await productContract.createLot(lotId, String(Math.floor(Date.now() / 1000)), String(lotDetails.expirationDate), BigInt(lotDetails.totalQuantity), BigInt(lotDetails.unitPrice), BigInt(lotDetails.productId))
    const receipt = await tx.wait()

    // Recupero ABI e address dell'InventoryManager
    const [inventoryAbi, inventoryAddress] =  await loadContract('InventoryManager')

    const inventoryContract = new ethers.Contract(inventoryAddress, inventoryAbi, signer)
    const tx2 = await inventoryContract.addToManufacturerInventory(lotId)
    const receipt2 = await tx2.wait()

  } catch (err) {
    console.log('Error in createProduct: ', err)
    throw err
  }
}

/**
 * Fetches a lot from the blockchain by its ID.
 * 
 * @param {*} id - The ID of the lot to fetch.
 * 
 * @returns {Promise<any>} A promise that resolves to the lot data.
 */
export async function getLot(id) {
  try {
    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)

    let lot = await contract.getLot(id)
    return lot
  } catch (err) {
    console.log('Error in getProduct: ', err)
    throw err
  }
}
