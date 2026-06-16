import { RefreshCcw, Ticket, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Address } from 'viem'
import { useAccount, useChainId, useConnect, useDisconnect, usePublicClient } from 'wagmi'

import { contractService } from '@/shared/services/contract-service'
import { eventsService } from '@/shared/services/events-service'
import type { Event, OwnedTicket } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'
import { WalletPill } from '@/shared/ui/wallet-pill'
import {
  countConfiguredCategories,
  readOwnedTicketsFromChain,
} from '@/shared/web3/contracts'
import { getKnownChainName } from '@/shared/web3/wagmi'

function ownershipBaseKey(ticket: OwnedTicket) {
  return [
    ticket.walletAddress.toLowerCase(),
    ticket.contractAddress.toLowerCase(),
    ticket.categoryId,
  ].join(':')
}

function ownershipExactKey(ticket: OwnedTicket) {
  return [ownershipBaseKey(ticket), ticket.tokenId ?? ticket.txHash ?? ticket.id].join(':')
}

export function MyTicketsPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const publicClient = usePublicClient()
  const [events, setEvents] = useState<Event[]>([])
  const [tickets, setTickets] = useState<OwnedTicket[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  const syncPage = useCallback(
    async ({ keepCurrentView = false } = {}) => {
      if (!keepCurrentView) {
        setStatus('loading')
      }

      try {
        setError('')
        const eventList = await eventsService.listEvents()
        setEvents(eventList)

        const mockOwnedTickets = address
          ? await contractService.getOwnedTickets(address)
          : []
        const onChainTickets =
          address && publicClient
            ? await readOwnedTicketsFromChain({
                account: address as Address,
                events: eventList,
                publicClient,
              })
            : []

        const chainCategoryKeys = new Set(onChainTickets.map(ownershipBaseKey))
        const mergedTickets = mockOwnedTickets.filter(
          (ticket) => ticket.tokenId !== null || !chainCategoryKeys.has(ownershipBaseKey(ticket)),
        )

        for (const onChainTicket of onChainTickets) {
          const alreadyListed = mergedTickets.some(
            (ticket) => ownershipExactKey(ticket) === ownershipExactKey(onChainTicket),
          )

          if (!alreadyListed) {
            mergedTickets.push(onChainTicket)
          }
        }

        setTickets(mergedTickets)
        setStatus('success')
      } catch (responseError) {
        setStatus('error')
        setError(
          responseError instanceof Error
            ? responseError.message
            : 'Could not read ticket ownership.',
        )
      }
    },
    [address, publicClient],
  )

  useEffect(() => {
    void syncPage()
  }, [syncPage])

  function connectWallet() {
    const injectedConnector = connectors[0]

    if (!injectedConnector) {
      setError('No injected wallet was found. Open the app with MetaMask installed.')
      setStatus('error')
      return
    }

    connect({ connector: injectedConnector })
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Reading wallet-owned tickets"
        description="Refreshing the connected wallet and combining on-chain ticket ownership with the demo fake-card mint records."
      />
    )
  }

  if (status === 'error') {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="We could not read wallet ownership"
        description={error}
      />
    )
  }

  if (!isConnected || !address) {
    return (
      <StateBlock
        eyebrow="Empty"
        title="Connect a wallet to see ticket ownership"
        description="This screen now uses a real injected wallet. It can read configured ticket contracts on-chain and also keep the fake-card demo flow visible locally."
        action={
          <Button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? 'Connecting wallet...' : 'Connect wallet'}
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-8">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3">
          <Badge className="w-fit">Wallet ownership</Badge>
          <div>
            <h1 className="font-display text-4xl">My NFT tickets</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              Tickets shown here are filtered by the connected wallet address. Real ETH
              purchases can be read on-chain, and the fake card flow still appears through the
              local demo store.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WalletPill account={address} network={getKnownChainName(chainId)} />
          <Button variant="secondary" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </Card>

      {tickets.length === 0 ? (
        <StateBlock
          eyebrow="Empty"
          title="No tickets are owned by this wallet yet"
          description="If you just bought with ETH, wait for the transaction confirmation, then refresh ownership. Sepolia can take a short moment to return the new token."
          action={
            <Button
              className="mx-auto gap-2"
              variant="secondary"
              onClick={() => void syncPage({ keepCurrentView: true })}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh ownership
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="grid gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {ticket.purchaseMethod} purchase
                  </p>
                  <h2 className="mt-2 font-display text-2xl">{ticket.eventTitle}</h2>
                </div>
                <div className="rounded-full bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Category:</span>{' '}
                  {ticket.categoryName}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Token ID:</span>{' '}
                  {ticket.tokenId ?? 'Waiting for chain read'}
                </p>
                {ticket.txHash ? (
                  <p className="break-all">
                    <span className="font-semibold text-[var(--foreground)]">Tx:</span>{' '}
                    {ticket.txHash}
                  </p>
                ) : null}
                <p className="break-all">
                  <span className="font-semibold text-[var(--foreground)]">Contract:</span>{' '}
                  {ticket.contractAddress}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="grid gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-[var(--accent)]" />
          <p className="font-semibold">Integration note</p>
        </div>
        <p className="text-sm leading-7 text-[var(--muted-foreground)]">
          Configured on-chain categories found: {countConfiguredCategories(events)}. Set the
          contract env vars for the seeded categories to make the ETH checkout and ownership
          views hit real contracts.
        </p>
      </Card>
    </div>
  )
}
