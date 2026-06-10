import { getAddress, isAddress, type Address, type PublicClient } from 'viem'

import type { Event, OwnedTicket, TicketCategory } from '@/shared/types/models'
import { ticketAbi } from '@/shared/web3/ticket-abi'

const contractOverrides: Record<string, string | undefined> = {
  'aurora-general': "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  'aurora-lounge': "0x5FbDB2315678afecb367f032d93F642f64180aa3",
}

function isMockContractAddress(address: string) {
  return address.toLowerCase().startsWith('0xcaffe1')
}

export function resolveCategoryContractAddress(category: TicketCategory) {
  const configuredAddress = contractOverrides[category.id]?.trim()
  const candidate = configuredAddress || category.contractAddress

  if (!candidate || isMockContractAddress(candidate) || !isAddress(candidate)) {
    return null
  }

  return getAddress(candidate)
}

export function hasConfiguredContract(category: TicketCategory) {
  return resolveCategoryContractAddress(category) !== null
}

export function countConfiguredCategories(events: Event[]) {
  return events.reduce((count, event) => {
    return (
      count +
      event.categories.filter((category) => hasConfiguredContract(category)).length
    )
  }, 0)
}

export async function readOwnedTicketsFromChain({
  account,
  events,
  publicClient,
}: {
  account: Address
  events: Event[]
  publicClient: PublicClient
}) {
  const results = await Promise.all(
    events.flatMap((event) =>
      event.categories.map(async (category) => {
        const resolvedAddress = resolveCategoryContractAddress(category)

        if (!resolvedAddress) {
          return [] as OwnedTicket[]
        }

        try {
          const tokenIds = await publicClient.readContract({
            address: resolvedAddress,
            abi: ticketAbi,
            functionName: 'ticketsOf',
            args: [account],
          })

          return tokenIds.map((tokenId) => ({
            id: `${category.id}-${tokenId.toString()}`,
            tokenId: Number(tokenId),
            eventId: event.id,
            eventTitle: event.title,
            categoryId: category.id,
            categoryName: category.name,
            walletAddress: account,
            contractAddress: resolvedAddress,
            purchaseMethod: 'ETH' as const,
          }))
        } catch {
          return [] as OwnedTicket[]
        }
      }),
    ),
  )

  return results.flat()
}
