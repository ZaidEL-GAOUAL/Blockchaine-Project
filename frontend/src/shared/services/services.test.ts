import { checkoutService } from '@/shared/services/checkout-service'
import { contractService } from '@/shared/services/contract-service'
import { eventsService } from '@/shared/services/events-service'
import { walletService } from '@/shared/services/wallet-service'
import type { TicketCategory } from '@/shared/types/models'

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

  it('completes a fake card purchase for an API-loaded category missing from the seed store', async () => {
    const apiCategory: TicketCategory = {
      id: 'test-event-test',
      eventId: 'test-event',
      name: 'test',
      symbol: 'TST',
      description: 'Category created through the backend API.',
      priceEth: 0.01,
      priceEur: 20,
      maxSupply: 100,
      mintedCount: 0,
      metadataUri: 'ipfs://test',
      contractAddress: '0x116EE27A78f1b275b1157ab49990f028be33DBA8',
      benefits: [],
    }
    const wallet = '0x296Db842ce2292Af3e70a22EC0000000C0DE123'

    const result = await checkoutService.payByCard(
      {
        eventId: apiCategory.eventId,
        categoryId: apiCategory.id,
        quantity: 1,
        cardholderName: 'zaid',
        cardNumber: '4242424242424242',
        expiration: '09/28',
        cvc: '153',
        walletAddress: wallet,
      },
      { event: { id: apiCategory.eventId, title: 'test' }, category: apiCategory },
    )

    expect(result.txHash).toContain('0xTX')

    const tickets = await contractService.getOwnedTickets(wallet)
    expect(tickets.at(-1)?.categoryName).toBe('test')
    expect(tickets.at(-1)?.contractAddress).toBe(apiCategory.contractAddress)
  })
})
