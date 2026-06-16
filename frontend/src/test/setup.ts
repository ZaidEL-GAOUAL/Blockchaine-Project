import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

import type { Event } from '@/shared/types/models'

let events: Event[]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    }),
  )
}

beforeEach(() => {
  events = [
    {
      id: 'test-event',
      title: 'Test Event',
      organizer: 'Test Organizer',
      date: '2026-09-18T20:30:00.000Z',
      venue: 'Grand Hall, Paris',
      description: 'API-provided event used by frontend tests.',
      heroImage: 'https://example.com/event.jpg',
      heroEyebrow: 'API event',
      categories: [
        {
          id: 'test-general',
          eventId: 'test-event',
          name: 'General Admission',
          symbol: 'GEN',
          description: 'General access',
          priceEth: 0.01,
          priceEur: 10,
          maxSupply: 100,
          mintedCount: 0,
          metadataUri: 'ipfs://test-event/general',
          contractAddress: '0x1111111111111111111111111111111111111111',
          benefits: ['NFT ticket'],
        },
      ],
    },
  ]

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input.toString())
      const method = init?.method ?? 'GET'

      if (method === 'GET' && url.pathname === '/events') {
        return jsonResponse(events)
      }

      const eventMatch = url.pathname.match(/^\/events\/([^/]+)$/)
      if (method === 'GET' && eventMatch) {
        const event = events.find((item) => item.id === eventMatch[1])
        return event
          ? jsonResponse(event)
          : jsonResponse({ detail: 'Event not found.' }, { status: 404 })
      }

      if (method === 'POST' && url.pathname === '/events') {
        const payload = JSON.parse(String(init?.body ?? '{}'))
        const event: Event = {
          id: slugify(payload.title) || 'event',
          title: payload.title,
          organizer: payload.organizer,
          date: payload.date,
          venue: payload.venue,
          description: payload.description ?? '',
          heroImage: payload.heroImage ?? '',
          heroEyebrow: 'Created from API',
          categories: [],
        }
        events = [event, ...events]
        return jsonResponse(event, { status: 201 })
      }

      const categoryMatch = url.pathname.match(/^\/events\/([^/]+)\/categories$/)
      if (method === 'POST' && categoryMatch) {
        const event = events.find((item) => item.id === categoryMatch[1])
        if (!event) {
          return jsonResponse({ detail: 'Event not found.' }, { status: 404 })
        }

        const payload = JSON.parse(String(init?.body ?? '{}'))
        const contractAddress = '0x2222222222222222222222222222222222222222'
        const category = {
          id: `${event.id}-${slugify(payload.name)}`,
          eventId: event.id,
          name: payload.name,
          symbol: payload.symbol,
          description: payload.description ?? '',
          priceEth: payload.priceEth,
          priceEur: payload.priceEur,
          maxSupply: payload.maxSupply,
          mintedCount: 0,
          metadataUri: payload.metadataUri ?? '',
          contractAddress,
          benefits: payload.benefits ?? [],
        }
        event.categories.push(category)
        return jsonResponse(
          {
            category,
            deployment: {
              contractAddress,
              symbol: category.symbol,
            },
          },
          { status: 201 },
        )
      }

      if (method === 'POST' && url.pathname === '/checkout/card') {
        return jsonResponse({ txHash: '0x3333333333333333333333333333333333333333' })
      }

      return jsonResponse({ detail: 'Not found.' }, { status: 404 })
    }),
  )
})
