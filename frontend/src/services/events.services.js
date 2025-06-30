import { BrowserProvider, Contract, formatUnits } from 'ethers'
import { loadContract } from '@/utils/abi.config'

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

    console.log('Formatted history:', history)
    return history
  } catch (error) {
    console.error('Error in getCashbackHistory:', error)
    throw error
  }
}

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
        event.pharmacy?.toLowerCase() === userAddress.toLowerCase()
      )
    })

    console.log('Complete transaction event list:', filteredEvents)
    return filteredEvents
  } catch (error) {
    console.error('Error in getTransactionEvents:', error)
    throw error
  }
}


