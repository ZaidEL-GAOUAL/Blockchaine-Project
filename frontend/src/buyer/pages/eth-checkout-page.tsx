import { CheckCircle2, Copy, RefreshCcw, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { parseEther } from 'viem'
import {
  useAccount,
  useChainId,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { formatEth } from '@/shared/lib/format'
import { eventsService } from '@/shared/services/events-service'
import type { Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'
import { WalletPill } from '@/shared/ui/wallet-pill'
import { resolveCategoryContractAddress } from '@/shared/web3/contracts'
import { ticketAbi } from '@/shared/web3/ticket-abi'
import { getKnownChainName, getRequiredChain } from '@/shared/web3/wagmi'

export function EthCheckoutPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const quantity = Number(searchParams.get('quantity') ?? '1')

  const [event, setEvent] = useState<Event | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [requestError, setRequestError] = useState('')
  const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const requiredChain = getRequiredChain()
  const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const {
    writeContractAsync,
    error: writeError,
    isPending: isWriting,
  } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: submittedHash,
    })

  useEffect(() => {
    let active = true

    eventsService
      .getEvent(eventId)
      .then((eventResponse) => {
        if (!active) {
          return
        }

        setEvent(eventResponse)
        setStatus('success')
      })
      .catch((responseError: Error) => {
        if (!active) {
          return
        }

        setStatus('error')
        setRequestError(responseError.message)
      })

    return () => {
      active = false
    }
  }, [eventId])

  const selectedCategory = useMemo(
    () => event?.categories.find((item) => item.id === categoryId) ?? null,
    [categoryId, event],
  )

  async function handleConnectWallet() {
    const injectedConnector = connectors[0]

    if (!injectedConnector) {
      setRequestError('No injected wallet was found. Open the page with MetaMask installed.')
      return
    }

    try {
      setRequestError('')
      connect({ connector: injectedConnector })
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error ? responseError.message : 'Wallet connection failed.',
      )
    }
  }

  async function handlePurchase() {
    if (!address || !selectedCategory) {
      return
    }

    const resolvedAddress = resolveCategoryContractAddress(selectedCategory)

    if (!resolvedAddress) {
      setRequestError(
        'This category does not have a real deployed contract configured yet. Add a real address in the Vite env vars first.',
      )
      return
    }

    if (chainId !== requiredChain.id) {
      try {
        await switchChainAsync({ chainId: requiredChain.id })
      } catch (responseError) {
        setRequestError(
          responseError instanceof Error
            ? responseError.message
            : 'Please switch to the configured network before purchasing.',
        )
      }
      return
    }

    try {
      setRequestError('')
      const result = await writeContractAsync({
        address: resolvedAddress,
        abi: ticketAbi,
        functionName: 'buy',
        args: [BigInt(quantity)],
        value: parseEther(selectedCategory.priceEth.toString()) * BigInt(quantity),
      })
      setSubmittedHash(result)
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error
          ? responseError.message
          : 'The wallet transaction could not be submitted.',
      )
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

  if (status === 'error' || !event || !selectedCategory) {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="The ETH checkout screen could not be prepared"
        description={requestError || 'The selected event or ticket category is unavailable.'}
      />
    )
  }

  const totalPrice = selectedCategory.priceEth * quantity
  const resolvedAddress = resolveCategoryContractAddress(selectedCategory)
  const currentError =
    requestError || writeError?.message || connectError?.message || ''
  const needsChainSwitch = isConnected && chainId !== requiredChain.id
  const activeChainName = getKnownChainName(chainId)

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="grid gap-5">
        <Badge className="w-fit">Wallet connection</Badge>
        <div>
          <h1 className="font-display text-4xl">Pay directly in ETH</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            This screen now uses a real injected-wallet flow with Wagmi. If you configure a
            deployed ticket contract address, the checkout writes directly on-chain.
          </p>
        </div>

        {isConnected && address ? (
          <WalletPill account={address} network={activeChainName} />
        ) : (
          <Button className="gap-2" onClick={handleConnectWallet} disabled={isConnecting}>
            <Wallet className="h-4 w-4" />
            {isConnecting ? 'Connecting wallet...' : 'Connect wallet'}
          </Button>
        )}

        <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5">
          <SummaryLine label="Event" value={event.title} />
          <SummaryLine label="Ticket" value={selectedCategory.name} />
          <SummaryLine label="Quantity" value={String(quantity)} />
          <SummaryLine label="Amount" value={formatEth(totalPrice)} />
        </div>

        {currentError ? (
          <p className="rounded-2xl bg-[rgba(196,92,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {currentError}
          </p>
        ) : null}

        {!resolvedAddress ? (
          <Card className="grid gap-3 bg-[rgba(196,92,58,0.06)]">
            <p className="font-semibold text-[var(--foreground)]">
              No real contract is configured for this category yet
            </p>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Add a deployed address in `.env.local` with the matching Vite variable, then
              restart the dev server. The seller screens still use mocked deployment for now.
            </p>
          </Card>
        ) : null}

        {submittedHash ? (
          <Card className="grid gap-3 bg-[var(--accent)]/8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
              <p className="font-semibold">
                {isConfirmed ? 'Transaction confirmed' : 'Transaction submitted'}
              </p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isConfirmed
                ? 'The transaction was mined. If the contract matches the expected ABI, My Tickets can now read the owned token IDs on-chain.'
                : 'The wallet transaction was submitted. Confirmation status is updating now.'}
            </p>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--panel)] px-4 py-3 text-sm">
              <span className="truncate">{submittedHash}</span>
              <Copy className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            {isConfirmed ? (
              <Link to="/my-tickets">
                <Button>Go to My Tickets</Button>
              </Link>
            ) : (
              <Button variant="secondary" disabled>
                Waiting for confirmation before tickets appear
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-3">
            {needsChainSwitch ? (
              <Button
                className="gap-2"
                onClick={handlePurchase}
                disabled={isSwitchingChain}
              >
                <RefreshCcw className="h-4 w-4" />
                {isSwitchingChain
                  ? 'Switching network...'
                  : `Switch to ${requiredChain.name}`}
              </Button>
            ) : (
              <Button
                disabled={!isConnected || !resolvedAddress || isWriting || isConfirming}
                onClick={handlePurchase}
              >
                {isWriting || isConfirming
                  ? 'Waiting for wallet confirmation...'
                  : 'Confirm ETH purchase'}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="grid gap-5">
        <Badge className="w-fit">Contract-facing summary</Badge>
        <h2 className="font-display text-3xl">{selectedCategory.name}</h2>
        <div className="grid gap-3 text-sm leading-7 text-[var(--muted-foreground)]">
          <p>• Wallet connect and transaction submission now use real Wagmi hooks.</p>
          <p>• The contract call expects the `buy(uint256)` function from your Solidity ticket contract.</p>
          <p>• Owned tickets can be read back on-chain through `ticketsOf(address)` when the contract address is real.</p>
        </div>
        <div className="rounded-[28px] bg-[var(--foreground)] p-6 text-[var(--paper)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,239,227,0.68)]">
            Contract address
          </p>
          <p className="mt-2 break-all font-mono text-sm">
            {resolvedAddress ?? 'Not configured in env yet'}
          </p>
          <p className="mt-3 text-xs text-[rgba(245,239,227,0.68)]">
            Required chain: {requiredChain.name}
          </p>
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
