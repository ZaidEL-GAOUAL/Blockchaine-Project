import { checkoutService } from '@/shared/services/checkout-service'
import { eventsService } from '@/shared/services/events-service'

describe('API services', () => {
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
    expect(createdCategory.deployment.contractAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('submits card checkout through the API', async () => {
    const result = await checkoutService.payByCard({
      eventId: 'test-event',
      categoryId: 'test-general',
      quantity: 1,
      cardholderName: 'Zaid El Gaoual',
      cardNumber: '4242424242424242',
      expiration: '09/28',
      cvc: '123',
      walletAddress: '0x2222222222222222222222222222222222222222',
    })

    expect(result.txHash).toMatch(/^0x[0-9a-fA-F]+$/)
  })
})
