import { BrowserProvider, Contract, formatUnits } from 'ethers'
import { loadContract } from '@/utils/abi.config'

/**
 * Get the cashback event history from the blockchain events
 * @returns {Array<Object>} An array of cashback event objects
 */
export async function getCashbackHistory() {
  try {
    const [abi, address] = await loadContract('CashbackHandler')

    const provider = new BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()

    const contract = new Contract(address, abi, provider)

    const filter = contract.filters.CashbackRedeemed(userAddress)

    const events = await contract.queryFilter(filter, 0, 'latest')

    const history = await Promise.all(
      events.map(async (e) => ({
        amount: formatUnits(e.args.amount, 18),
        date: new Date((await e.getBlock()).timestamp * 1000),
        transactionHash: e.transactionHash,
      }))
    )

    return history
  } catch (error) {
    console.error('Error in getCashbackHistory:', error)
    throw error
  }
}

/**
 * Get the transaction events from the blockchain events, filtering for events 
 * regarding the active wallet
 * @returns {Array<Object>} An array of Transaction event objects
 */
export async function getTransactionEvents() {
  try {
    const [abi, address] = await loadContract('TransactionManager')

    const provider = new BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()

    const contract = new Contract(address, abi, provider)

    const eventTypes = [
      'AddedTransaction',
      'AcceptedTransaction',
      'RejectedTransaction',
      'RemovedTransaction',
      'SaleToCustomer',
    ]

    const allEvents = await Promise.all(
      eventTypes.map(async (eventType) => {
        const filter = contract.filters[eventType]()
        const events = await contract.queryFilter(filter, 0, 'latest')

        return Promise.all(
          events.map(async (e) => {
            const block = await e.getBlock()
            const base = {
              type: eventType,
              transactionHash: e.transactionHash,
              blockNumber: e.blockNumber,
              timestamp: new Date(block.timestamp * 1000),
            }

            const args = e.args

            if (eventType === 'SaleToCustomer') {
              return {
                ...base,
                pharmacy: args.pharmacy,
                lotIds: args.lotIds.map((id) => id.toString()),
                quantities: args.quantities.map((q) => q.toString()),
                totalValue: args.totalValue.toString(),
              }
            } else {
              const tx = args[3]
              return {
                ...base,
                from: args.from,
                isFrom: args.from.toLowerCase() === userAddress.toLowerCase(),
                to: args.to,
                detailsHash: args.detailsHash,
                lotIds: tx.lotIds.map((id) => id.toString()),
                quantities: tx.quantities.map((q) => q.toString()),
                transactionTimestamp: new Date(Number(tx.timestamp) * 1000),
              }
            }
          })
        )
      })
    )

    const flatEvents = allEvents.flat()

    flatEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())


    const filteredEvents = flatEvents.filter((event) => {
      return (
        event.from?.toLowerCase() === userAddress.toLowerCase() ||
        event.to?.toLowerCase() === userAddress.toLowerCase() ||
        event.pharmacy?.toLowerCase() === userAddress.toLowerCase()
      )
    })

    return filteredEvents
  } catch (error) {
    console.error('Error in getTransactionEvents:', error)
    throw error
  }
}


