import { CheckCircle2, CreditCard, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { formatEur } from '@/shared/lib/format'
import { checkoutService } from '@/shared/services/checkout-service'
import { eventsService } from '@/shared/services/events-service'
import type { CardCheckoutPayload, Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/field'
import { StateBlock } from '@/shared/ui/state-block'

interface CardErrors {
  cardholderName?: string
  cardNumber?: string
  expiration?: string
  cvc?: string
  walletAddress?: string
}

export function CardCheckoutPage() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const quantity = Number(searchParams.get('quantity') ?? '1')

  const [event, setEvent] = useState<Event | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [requestError, setRequestError] = useState('')
  const [errors, setErrors] = useState<CardErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [form, setForm] = useState<CardCheckoutPayload>({
    eventId,
    categoryId,
    quantity,
    cardholderName: '',
    cardNumber: '',
    expiration: '',
    cvc: '',
    walletAddress: '',
  })

  useEffect(() => {
    let active = true

    eventsService
      .getEvent(eventId)
      .then((response) => {
        if (!active) {
          return
        }

        setEvent(response)
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

  function updateField<Key extends keyof CardCheckoutPayload>(
    key: Key,
    value: CardCheckoutPayload[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateForm() {
    const nextErrors: CardErrors = {}

    if (!form.cardholderName.trim()) {
      nextErrors.cardholderName = 'Cardholder name is required.'
    }
    if (!/^\d{16}$/.test(form.cardNumber.replace(/\s+/g, ''))) {
      nextErrors.cardNumber = 'Use a fake 16-digit card number.'
    }
    if (!/^\d{2}\/\d{2}$/.test(form.expiration)) {
      nextErrors.expiration = 'Use the MM/YY format.'
    }
    if (!/^\d{3}$/.test(form.cvc)) {
      nextErrors.cvc = 'Use a fake 3-digit CVC.'
    }
    if (!/^0x[a-fA-F0-9]{8,}$/.test(form.walletAddress)) {
      nextErrors.walletAddress = 'Enter a wallet-like address starting with 0x.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()

    if (!validateForm()) {
      setRequestError('Please fix the highlighted fields before continuing.')
      return
    }

    try {
      setRequestError('')
      setIsSubmitting(true)
      const result = await checkoutService.payByCard(form)
      setTxHash(result.txHash)
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error ? responseError.message : 'Card checkout failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!eventId || !categoryId || Number.isNaN(quantity) || quantity <= 0) {
    return (
      <StateBlock
        eyebrow="Validation error"
        title="The card checkout route is incomplete"
        description="Start from the event page so the selected category and quantity are carried into this form."
      />
    )
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Preparing the fake euro checkout"
        description="Fetching the event and category data before rendering the card form."
      />
    )
  }

  if (status === 'error' || !event || !selectedCategory) {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="The card checkout screen could not be prepared"
        description={requestError || 'The selected event or ticket category could not be found.'}
      />
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="grid gap-5">
            <Badge className="w-fit">Fake euro checkout</Badge>
        <div>
          <h1 className="font-display text-4xl">Pay by card, mint to a wallet</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            This form mirrors the off-chain payment step from the course brief. The wallet
            address is still captured because the NFT must end up owned by the buyer.
          </p>
        </div>

        {txHash ? (
          <Card className="grid gap-4 bg-[var(--accent)]/8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
              <p className="font-semibold">Card checkout accepted</p>
            </div>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              The backend accepted the off-chain payment step and submitted the NFT mint
              transaction for the buyer wallet.
            </p>
            <div className="rounded-2xl bg-[var(--panel)] px-4 py-3 text-sm">
              Mint transaction hash: <span className="font-semibold">{txHash}</span>
            </div>
            <Link to="/my-tickets">
              <Button>Open My Tickets</Button>
            </Link>
          </Card>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input
              label="Cardholder name"
              placeholder="Zaid El Gaoual"
              value={form.cardholderName}
              error={errors.cardholderName}
              onChange={(eventObject) =>
                updateField('cardholderName', eventObject.target.value)
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Fake card number"
                placeholder="4242424242424242"
                value={form.cardNumber}
                error={errors.cardNumber}
                onChange={(eventObject) =>
                  updateField('cardNumber', eventObject.target.value)
                }
              />
              <Input
                label="Wallet address"
                placeholder="0xA81E..."
                value={form.walletAddress}
                error={errors.walletAddress}
                onChange={(eventObject) =>
                  updateField('walletAddress', eventObject.target.value)
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Expiration"
                placeholder="09/28"
                value={form.expiration}
                error={errors.expiration}
                onChange={(eventObject) =>
                  updateField('expiration', eventObject.target.value)
                }
              />
              <Input
                label="CVC"
                placeholder="123"
                value={form.cvc}
                error={errors.cvc}
                onChange={(eventObject) => updateField('cvc', eventObject.target.value)}
              />
            </div>

            {requestError ? (
              <p className="rounded-2xl bg-[rgba(196,92,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                {requestError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing card checkout...' : 'Confirm card checkout'}
            </Button>
          </form>
        )}
      </Card>

      <Card className="grid gap-5">
        <Badge className="w-fit">Order summary</Badge>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-3xl">{selectedCategory.name}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{event.title}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5">
          <SummaryLine label="Quantity" value={String(quantity)} />
          <SummaryLine label="Price per ticket" value={formatEur(selectedCategory.priceEur)} />
          <SummaryLine
            label="Total"
            value={formatEur(selectedCategory.priceEur * quantity)}
          />
          <SummaryLine label="Contract" value={selectedCategory.contractAddress} />
        </div>

        <div className="rounded-[28px] bg-[var(--foreground)] p-6 text-[var(--paper)]">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[var(--highlight)]" />
            <p className="font-semibold">What this screen is proving</p>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[rgba(245,239,227,0.8)]">
            <p>• Buyers can choose the non-crypto checkout path.</p>
            <p>• The form still links the purchase to a wallet address.</p>
            <p>• The backend mints the NFT to the wallet address after accepting the card flow.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[18rem] break-all text-right font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}
