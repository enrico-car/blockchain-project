import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { loadContract } from '@/utils/abi.config'



/**
 * Get the inventory of the active wallet
 * 
 * @returns {Array<{
*   lotIds: number[],     // Array of lot IDs (integers)
*   quantities: number[]  // Array of quantities corresponding to each lot ID
* }>} An array of inventory item objects
*/
export async function getInventory() {

  const [abi, address] = await loadContract('InventoryManager')

  const provider = new Web3Provider(window.ethereum)
  const signer = provider.getSigner()

  const contract = new ethers.Contract(address, abi, signer)

  let [lots, quantities] = await contract.getMyInventory({gasPrice: 0 })

  lots = lots.map((id) => id.toString())
  quantities = quantities.map((qt) => qt.toString())

  return { lotIds: lots, quantities: quantities }
}
