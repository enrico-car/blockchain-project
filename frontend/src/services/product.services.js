import { ethers, keccak256, toUtf8Bytes } from 'ethers';
import { Web3Provider } from "@ethersproject/providers";

import axios from 'axios';

const contractName = 'ProductManager';
const ENDPOINT_URL = 'http://localhost:3000/api';

function generateDppHash(dpp) {
  // serialize object to generate numerical hash
  function serialize(obj) {
    if (obj === null || obj === undefined) return "";
    if (Array.isArray(obj)) {
      // join array elements
      return "[" + obj.map(serialize).join(",") + "]";
    }
    if (typeof obj === "object") {
      // sort keys to have determinism
      const sortedKeys = Object.keys(obj).sort();
      return "{" + sortedKeys.map(key => `"${key}":${serialize(obj[key])}`).join(",") + "}";
    }
    return String(obj);
  }

  const serialized = serialize(dpp);
  const hashHex = keccak256(toUtf8Bytes(serialized));
  const numericHash = BigInt(hashHex);
  return numericHash;
}

async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashDppFields(dpp) {
  const hashedDpp = {};

  for (const [key, value] of Object.entries(dpp)) {
    if (typeof value === "string") {
      hashedDpp[key] = hashString(value);
    } else if (Array.isArray(value)) {
      const joined = value.join(""); // flatten to one string
      hashedDpp[key] = hashString(joined);
    } else if (value != null) {
      // fallback: hash string representation of other values
      hashedDpp[key] = hashString(String(value));
    }
    // skip undefined/null
  }

  return hashedDpp;
}

export async function createProduct(dpp) {

    try {
        console.log(dpp);
        //generate numerical hash based on dpp fields
        const numericHash = generateDppHash(dpp);
        console.log("Product numeric hash:", numericHash.toString());

        //hash every single field of the dpp before storing it into the blockchain
        var dppHash = await hashDppFields(dpp);

        //blockchain
        var response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`);
        const { abi, address } = response.data;

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(`signer: ${await signer.getAddress()}`);

        const contract = new ethers.Contract(address, abi, signer);
        console.log(dppHash);
        const tx = await contract.createProduct(numericHash, dppHash);
        console.log(`Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(receipt);

        //if blockchain ok, save on database
        dpp.id = numericHash.toString();

        const formData = new FormData();

        for (const [key, value] of Object.entries(dpp)) {
        if (key === "image" && value) {
            // image should be a File or Blob object
            formData.append("image", value);
        } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value)); // stringify arrays
        } else if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
        }

        // Post formData with image to backend
        response = await axios.post(`${ENDPOINT_URL}/product/create`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("Saved in database");

    } catch(err){
        console.log('Error in createProduct: ', err);
        throw err;
    }
}

export async function removeProduct(dpp) {

    try {
        console.log(dpp);
        //generate numerical hash based on dpp fields
        const numericHash = generateDppHash(dpp);
        console.log("Product numeric hash:", numericHash.toString());

        //blockchain
        var response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`);
        const { abi, address } = response.data;

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(`signer: ${await signer.getAddress()}`);

        const contract = new ethers.Contract(address, abi, signer);
        const tx = await contract.removeProduct(numericHash);
        console.log(`Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(receipt);

        //if blockchain ok, delete also from database
        response = await axios.delete(`${ENDPOINT_URL}/product/delete/${numericHash}`);
        console.log("Deleted from database");

    } catch(err){
        console.log('Error in createProduct: ', err);
        throw err;
    }
}

export async function getProduct(id) {

    try {
        //blockchain
        var response = await axios.get(`${ENDPOINT_URL}/contract/${contractName}`);
        const { abi, address } = response.data;

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(`signer: ${await signer.getAddress()}`);

        const contract = new ethers.Contract(address, abi, signer);
        const receipt = await contract.getProduct(id);

        console.log(receipt);

    } catch(err){
        console.log('Error in getProduct: ', err);
        throw err;
    }
}