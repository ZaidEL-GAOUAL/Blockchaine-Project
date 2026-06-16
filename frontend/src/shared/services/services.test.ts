import { contractService } from '@/shared/services/contract-service'
import { eventsService } from '@/shared/services/events-service'
import { walletService } from '@/shared/services/wallet-service'

describe('mock services', () => {
  it('creates seller content and exposes it through the event list', async () => {
    const createdEvent = await eventsService.createEvent({
      title: 'Midnight Ledger',
      organizer: 'Chain House',
      date: '2026-12-01T20:00',
      venue: 'Warehouse 18',
      description: 'Test event for service coverage.',
      heroImage: 'https://example.com/hero.jpg',
    })

    const createdCategory = await eventsService.createCategory(createdEvent.id, {
      name: 'Founders Pass',
      symbol: 'FND',
      description: 'A premium pass for early supporters.',
      priceEth: 0.22,
      priceEur: 149,
      maxSupply: 25,
      metadataUri: 'ipfs://midnight-ledger/founders',
      benefits: ['Signed poster'],
    })

    const events = await eventsService.listEvents()

    expect(events[0].id).toBe(createdEvent.id)
    expect(createdCategory.deployment.contractAddress).toContain('0xCAFFE1')
  })

  it('connects a wallet and returns owned tickets after purchase', async () => {
    const session = await walletService.connect()

    await contractService.buyTickets({
      categoryId: 'aurora-general',
      quantity: 1,
      account: session.account!,
    })

    const tickets = await contractService.getOwnedTickets(session.account!)

    expect(tickets.length).toBeGreaterThan(1)
    expect(tickets.at(-1)?.categoryId).toBe('aurora-general')
  })

  it('records confirmed ETH receipts while token ids are still loading from chain', async () => {
    const session = await walletService.connect()
    const event = await eventsService.getEvent('aurora-city-live')
    const category = event.categories[0]

    contractService.recordConfirmedPurchase({
      event,
      category,
      quantity: 1,
      account: session.account!,
      txHash: '0xabc123',
    })

    const tickets = await contractService.getOwnedTickets(session.account!)
    const receipt = tickets.find((ticket) => ticket.txHash === '0xabc123')

    expect(receipt?.categoryId).toBe(category.id)
    expect(receipt?.tokenId).toBeNull()
  })
})
