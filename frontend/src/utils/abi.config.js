import { getAllDbProducts } from '@/services/product.services'
import axios from 'axios'

const ENDPOINT = 'http://localhost:3000/api/contract'

export async function loadContract(name) {

  const { data } = await axios.get(`${ENDPOINT}/${name}`)

  if (!data || !data.abi || !data.address) {
    throw new Error(`Error retriving the "${name}" contract's data`)
  }

  return [data.abi, data.address]
}

// Return a merge of the lot details in blockchain and the product details in the MongoDb database
export async function processLots(lots) {
  // Extract all ids from lots
  const ids = lots.map(lot => lot[4].toString());

  // Read all db products
  const dbProducts = await getAllDbProducts();

  // Filter products from db that have id in extracted ids
  const filteredDbProducts = dbProducts.filter(prod => ids.includes(prod.id));

  // Create a map id -> product
  const dbProductMap = {};
  filteredDbProducts.forEach(prod => {
    dbProductMap[prod.id] = prod;
  });

  // For every lot do a merge with the corresponding product details extracted from db
  const merged = lots.map(lot => {
    const id = lot[4].toString();

    const lotData = {
      expireDate: lot[0],
      quantity: parseInt(lot[7]),
      unitPrice: (parseInt(lot[3])/100),
      lotId: String(lot[6]),
      id: id,
    };

    const dbData = dbProductMap[id] || {};

    return {
      ...lotData,
      ...dbData
    };
  });

  return merged;
}
  