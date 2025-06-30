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

export async function processLots(lots) {
    // Estrai gli ID dai lotti (qui lotti sono oggetti con chiavi 0,1,2,3)
    const ids = lots.map(lot => lot[4].toString()); // converto BigInt in stringa per sicurezza
  
    // Leggi tutti i prodotti dal database
    const dbProducts = await getAllDbProducts();
  
    // console.log("PP", dbProducts)
    // console.log(ids)

    // Filtra i prodotti dal db che hanno id negli ids estratti
    const filteredDbProducts = dbProducts.filter(prod => ids.includes(prod.id));
  
    // Crea una mappa id -> prodotto per accesso veloce
    const dbProductMap = {};
    filteredDbProducts.forEach(prod => {
      dbProductMap[prod.id] = prod;
    });
  
    // Per ogni lotto fai il merge con il prodotto corrispondente
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

    // console.log("M:", merged)
  
    return merged;
  }
  