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
  console.log(serialized)
  
  const hashHex = keccak256(toUtf8Bytes(serialized))
  const numericHash = BigInt(hashHex)
  return numericHash
}

export function hashObjectDetails(obj) {
  const serialize = v =>
    v === null || v === undefined
      ? ''
      : Array.isArray(v)
        ? `[${v.map(serialize).join(',')}]`
        : typeof v === 'object'
          ? `{${Object.keys(v).sort().map(k => `"${k}":${serialize(v[k])}`).join(',')}}`
          : String(v)

  const hashField = v => {
    if (typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, hashField(val)]))
    }
    return BigInt(keccak256(toUtf8Bytes(serialize(v))))
  }

  return hashField(obj)
}

async function hashString(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashDppFields(dpp) {
  const hashedDpp = {}

  for (const [key, value] of Object.entries(dpp)) {
    if (typeof value === 'string') {
      hashedDpp[key] = await hashString(value)
    } else if (Array.isArray(value)) {
      const joined = value.join('') // flatten to one string
      hashedDpp[key] = await hashString(joined)
    } else if (value != null) {
      // fallback: hash string representation of other values
      hashedDpp[key] = await hashString(String(value))
    }
    // skip undefined/null
  }

  return hashedDpp
}

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


async function hashDppFields2(dpp) {
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

export async function createProduct(dpp) {
  try {
    console.log(dpp)
    //generate numerical hash based on dpp fields
    const numericHash = generateIdFromObject(dpp)
    console.log('Product numeric hash:', numericHash.toString())

    //hash every single field of the dpp before storing it into the blockchain
    console.log("PIP:", dpp)
    var dppHash = await hashDppFields2(dpp)

    console.log("SCHIFO")
    console.log(dppHash)

    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    console.log(`signer: ${await signer.getAddress()}`)

    const contract = new ethers.Contract(address, abi, signer)
    console.log(dppHash)
    const tx = await contract.createProduct(numericHash, dppHash)
    console.log(tx)
    console.log(`Transaction submitted: ${tx.hash}`)

    const receipt = await tx.wait()
    console.log(receipt)

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

    console.log(formData)

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

export async function removeProduct(dpp) {
  try {
    console.log(dpp)
    //generate numerical hash based on dpp fields
    const numericHash = generateIdFromObject(dpp)
    console.log('Product numeric hash:', numericHash.toString())

    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    console.log(`signer: ${await signer.getAddress()}`)

    const contract = new ethers.Contract(address, abi, signer)
    const tx = await contract.removeProduct(numericHash)
    console.log(`Transaction submitted: ${tx.hash}`)

    const receipt = await tx.wait()
    console.log(receipt)

    //if blockchain ok, delete also from database
    let response = await axios.delete(`${ENDPOINT_URL}/product/delete/${numericHash}`)
    console.log('Deleted from database')
  } catch (err) {
    console.log('Error in createProduct: ', err)
    throw err
  }
}

export async function getProduct(id) {
  try {
    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    console.log(`signer: ${await signer.getAddress()}`)

    const contract = new ethers.Contract(address, abi, signer)

    let product = await contract.getProduct(id)

    // Returns only the product dpp Hashed content
    return { product: product[0].toString() }
  } catch (err) {
    console.log('Error in getProduct: ', err)
    throw err
  }
}

export async function getAllProducts() {
  try {
    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    console.log(`signer: ${await signer.getAddress()}`)

    const contract = new ethers.Contract(address, abi, signer)

    let [ids, products] = await contract.getAllProducts()

    ids = ids.map((id) => id.toString())
    products = products.map((details) => details.toString())

    return { ids: ids, products: products }
  } catch (err) {
    console.log('Error in getProduct: ', err)
  }
}

// TODO crere un file per l'interazione unicamente con mongo?
export async function getAllDbProducts() {
  try {
    let response = await axios.get(`${ENDPOINT_URL}/product/all`)
    console.log(response.data)

    return response.data.products
  } catch (error) {
    console.log(error)
  }
}

export async function createProductLot(lotDetails) {
  try {
    //generate numerical hash based on dpp fields
    console.log(lotDetails)
    const lotId = generateIdFromObject(lotDetails)
    console.log(lotId)

    // Recupero ABI e address del contratto del prodotto
    const [productAbi, productAddress] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const productContract = new ethers.Contract(productAddress, productAbi, signer)
    const tx = await productContract.createLot(lotId, String(Math.floor(Date.now() / 1000)), String(lotDetails.expirationDate), BigInt(lotDetails.totalQuantity), BigInt(lotDetails.unitPrice), BigInt(lotDetails.productId))
    console.log(`Transaction submitted: ${tx.hash}`)
    const receipt = await tx.wait()

    // Recupero ABI e address dell'InventoryManager
    const [inventoryAbi, inventoryAddress] =  await loadContract('InventoryManager')

    const inventoryContract = new ethers.Contract(inventoryAddress, inventoryAbi, signer)
    const tx2 = await inventoryContract.addToManufacturerInventory(lotId)
    const receipt2 = await tx2.wait()
    console.log(receipt2)
  } catch (err) {
    console.log('Error in createProduct: ', err)
    throw err
  }
}

export async function getLot(id) {
  try {
    //blockchain
    const [abi, address] = await loadContract('ProductManager')

    const provider = new Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(address, abi, signer)

    let lot = await contract.getLot(id)

    // Returns only the product dpp Hashed content
    return lot
  } catch (err) {
    console.log('Error in getProduct: ', err)
    throw err
  }
}
