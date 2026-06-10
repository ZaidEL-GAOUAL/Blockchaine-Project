import { CheckCircle2, Copy, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { formatEth } from '@/shared/lib/format'
import { contractService } from '@/shared/services/contract-service'
import { eventsService } from '@/shared/services/events-service'
import { walletService } from '@/shared/services/wallet-service'
import type { Event, WalletSession } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'
import { WalletPill } from '@/shared/ui/wallet-pill'

export function EthCheckoutPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const quantity = Number(searchParams.get('quantity') ?? '1')

  const [event, setEvent] = useState<Event | null>(null)
  const [wallet, setWallet] = useState<WalletSession | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [requestError, setRequestError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([eventsService.getEvent(eventId), walletService.getSession()])
      .then(([eventResponse, walletResponse]) => {
        if (!active) {
          return
        }

        setEvent(eventResponse)
        setWallet(walletResponse)
        setStatus('success')
      })
      .catch((responseError: Error) => {
        if (!active) {
          return
        }

        setStatus('error')
        setRequestError(responseError.message)
      })

    const unsubscribe = walletService.subscribe(() => {
      walletService.getSession().then((nextSession) => {
        if (active) {
          setWallet(nextSession)
        }
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [eventId])

  const selectedCategory = useMemo(
    () => event?.categories.find((item) => item.id === categoryId) ?? null,
    [categoryId, event],
  )

  async function handleConnectWallet() {
    setWallet(await walletService.connect())
  }

  async function handlePurchase() {
    if (!wallet?.account || !selectedCategory) {
      return
    }

    try {
      setIsSubmitting(true)
      setRequestError('')
      const result = await contractService.buyTickets({
        categoryId,
        quantity,
        account: wallet.account,
      })
      setTxHash(result.txHash)
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error ? responseError.message : 'Unknown wallet error.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!eventId || !categoryId || Number.isNaN(quantity) || quantity <= 0) {
    return (
      <StateBlock
        eyebrow="Validation error"
        title="The checkout link is incomplete"
        description="Choose a ticket category from the event page before opening the ETH checkout route."
        action={
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
        }
      />
    )
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Warming up wallet checkout"
        description="Fetching the event details and the current mock wallet session before the ETH purchase screen renders."
      />
    )
  }

  if (status === 'error' || !event || !selectedCategory || !wallet) {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="The ETH checkout screen could not be prepared"
        description={requestError || 'The selected event or ticket category is unavailable.'}
      />
    )
  }

  const totalPrice = selectedCategory.priceEth * quantity

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="grid gap-5">
        <Badge className="w-fit">Wallet connection</Badge>
        <div>
          <h1 className="font-display text-4xl">Pay directly in ETH</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            This mocked flow stands in for the on-chain purchase method. The screen keeps the
            same decisions you would need later when Wagmi or Ethers are connected.
          </p>
        </div>

        {wallet.isConnected && wallet.account ? (
          <WalletPill account={wallet.account} network={wallet.network} />
        ) : (
          <Button className="gap-2" onClick={handleConnectWallet}>
            <Wallet className="h-4 w-4" />
            Connect mocked wallet
          </Button>
        )}

        <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5">
          <SummaryLine label="Event" value={event.title} />
          <SummaryLine label="Ticket" value={selectedCategory.name} />
          <SummaryLine label="Quantity" value={String(quantity)} />
          <SummaryLine label="Amount" value={formatEth(totalPrice)} />
        </div>

        {requestError ? (
          <p className="rounded-2xl bg-[rgba(196,92,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {requestError}
          </p>
        ) : null}

        {txHash ? (
          <Card className="grid gap-3 bg-[var(--accent)]/8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
              <p className="font-semibold">Mock transaction confirmed</p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your purchase was recorded in the mock contract service and can now be seen in
              the My Tickets view.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--panel)] px-4 py-3 text-sm">
              <span className="truncate">{txHash}</span>
              <Copy className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            <Link to="/my-tickets">
              <Button>Go to My Tickets</Button>
            </Link>
          </Card>
        ) : (
          <Button disabled={!wallet.isConnected || isSubmitting} onClick={handlePurchase}>
            {isSubmitting ? 'Submitting purchase...' : 'Confirm ETH purchase'}
          </Button>
        )}
      </Card>

      <Card className="grid gap-5">
        <Badge className="w-fit">Contract-facing summary</Badge>
        <h2 className="font-display text-3xl">{selectedCategory.name}</h2>
        <div className="grid gap-3 text-sm leading-7 text-[var(--muted-foreground)]">
          <p>• This flow assumes the buyer sends the exact ETH amount to the contract.</p>
          <p>• Quantity and stock are validated against the mocked contract state.</p>
          <p>• Successful purchases mint token IDs and create ownership records for My Tickets.</p>
        </div>
        <div className="rounded-[28px] bg-[var(--foreground)] p-6 text-[var(--paper)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,239,227,0.68)]">
            Contract address
          </p>
          <p className="mt-2 break-all font-mono text-sm">{selectedCategory.contractAddress}</p>
        </div>
      </Card>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-semibold text-[var(--foreground)]">{value}</span>
    </div>
  )
}
