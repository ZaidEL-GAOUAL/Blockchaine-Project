import type { Event } from '@/shared/types/models'

export const DEFAULT_WALLET_ADDRESS = '0xA81E3D0A5C0FFEE00000000000000000C0DE123'

export const seedEvents: Event[] = [
  {
    id: 'aurora-city-live',
    title: 'Aurora City Live',
    organizer: 'Nova Nights',
    date: '2026-09-18T20:30:00.000Z',
    venue: 'Grand Hall, Paris',
    description:
      'An electronic night built as a demo event for the NFT ticketing platform. Buyers can choose a classic pass or a lounge experience, then check out in ETH or with a fake card flow.',
    heroImage:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    heroEyebrow: 'Blockchain ticketing showcase',
    categories: [
      {
        id: 'aurora-general',
        eventId: 'aurora-city-live',
        name: 'General Admission',
        symbol: 'AUR-GA',
        description: 'Fast entry, standing access, and one collectible NFT ticket.',
        priceEth: 0.08,
        priceEur: 49,
        maxSupply: 500,
        mintedCount: 312,
        metadataUri: 'ipfs://aurora-city/general',
        contractAddress: '0xCAFFE100000000000000000000000000000001',
        benefits: ['Collectible NFT ticket', 'Priority help desk', 'Standard floor access'],
      },
      {
        id: 'aurora-lounge',
        eventId: 'aurora-city-live',
        name: 'Lounge Pass',
        symbol: 'AUR-LNG',
        description: 'A smaller allocation with private bar, quicker entry, and NFT proof.',
        priceEth: 0.18,
        priceEur: 119,
        maxSupply: 120,
        mintedCount: 54,
        metadataUri: 'ipfs://aurora-city/lounge',
        contractAddress: '0xCAFFE100000000000000000000000000000002',
        benefits: ['Lounge access', 'Private bar line', 'Premium NFT artwork'],
      },
    ],
  },
]
