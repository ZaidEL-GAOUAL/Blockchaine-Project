import { Ticket, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

import { contractService } from '@/shared/services/contract-service'
import { walletService } from '@/shared/services/wallet-service'
import type { OwnedTicket, WalletSession } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'
import { WalletPill } from '@/shared/ui/wallet-pill'

export function MyTicketsPage() {
  const [wallet, setWallet] = useState<WalletSession | null>(null)
  const [tickets, setTickets] = useState<OwnedTicket[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function syncPage() {
      try {
        const session = await walletService.getSession()
        if (!active) {
          return
        }

        setWallet(session)

        if (session.account) {
          const owned = await contractService.getOwnedTickets(session.account)
          if (active) {
            setTickets(owned)
          }
        } else {
          setTickets([])
        }

        if (active) {
          setStatus('success')
        }
      } catch (responseError) {
        if (active) {
          setStatus('error')
          setError(
            responseError instanceof Error
              ? responseError.message
              : 'Could not read ticket ownership.',
          )
        }
      }
    }

    syncPage()

    const unsubscribe = walletService.subscribe(() => {
      void syncPage()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function connectWallet() {
    setStatus('loading')
    await walletService.connect()
  }

  async function disconnectWallet() {
    setStatus('loading')
    await walletService.disconnect()
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Reading wallet-owned tickets"
        description="Refreshing the current wallet session and matching owned NFT tickets from the mock contract service."
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

  if (!wallet?.isConnected || !wallet.account) {
    return (
      <StateBlock
        eyebrow="Empty"
        title="Connect a wallet to see ticket ownership"
        description="This screen intentionally mirrors the course use case where a buyer can only inspect their NFT tickets once they are logged in with their wallet."
        action={<Button onClick={connectWallet}>Connect mocked wallet</Button>}
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
              Tickets shown here are filtered by the connected wallet address and reflect both
              ETH and fake card purchase paths.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WalletPill account={wallet.account} network={wallet.network} />
          <Button variant="secondary" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
      </Card>

      {tickets.length === 0 ? (
        <StateBlock
          eyebrow="Empty"
          title="No tickets are owned by this wallet yet"
          description="Complete a purchase in the ETH or fake card checkout flows, then return here to verify ownership."
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
                  {ticket.tokenId}
                </p>
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
          This page is already shaped like the real web3 version: replace the mocked wallet
          session and ownership service with live on-chain reads, and the UI can stay almost
          unchanged.
        </p>
      </Card>
    </div>
  )
}
