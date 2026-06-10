import { CalendarDays, CreditCard, Landmark, MapPin, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { formatDate, formatEth, formatEur } from '@/shared/lib/format'
import { eventsService } from '@/shared/services/events-service'
import type { Event, TicketCategory } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { StateBlock } from '@/shared/ui/state-block'
import { TicketCategoryCard } from '@/shared/ui/ticket-category-card'

export function EventPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [quantity, setQuantity] = useState(2)

  useEffect(() => {
    let active = true

    eventsService
      .getEvent(eventId)
      .then((response) => {
        if (!active) {
          return
        }

        setEvent(response)
        setSelectedCategoryId(response.categories[0]?.id ?? '')
        setStatus('success')
      })
      .catch((responseError: Error) => {
        if (!active) {
          return
        }

        setStatus('error')
        setError(responseError.message)
      })

    const unsubscribe = eventsService.subscribe(() => {
      eventsService
        .getEvent(eventId)
        .then((response) => {
          if (active) {
            setEvent(response)
          }
        })
        .catch(() => undefined)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [eventId])

  const selectedCategory = useMemo(() => {
    return event?.categories.find((item) => item.id === selectedCategoryId) ?? null
  }, [event, selectedCategoryId])

  function goToCheckout(pathname: string) {
    if (!selectedCategory) {
      return
    }

    navigate(
      `${pathname}?eventId=${eventId}&categoryId=${selectedCategory.id}&quantity=${quantity}`,
    )
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Preparing event details"
        description="Fetching the event, seller-defined ticket categories, and current availability from the mock store."
      />
    )
  }

  if (status === 'error') {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="The event could not be loaded"
        description={error}
        action={
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
        }
      />
    )
  }

  if (!event) {
    return null
  }

  if (event.categories.length === 0) {
    return (
      <StateBlock
        eyebrow="Empty"
        title="No ticket categories are live yet"
        description="The event exists, but the seller has not created any categories yet. Add one from the seller dashboard."
        action={
          <Link to={`/seller/events/${event.id}/categories/new`}>
            <Button>Create ticket category</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-6 overflow-hidden p-0">
          <div
            className="min-h-72 bg-cover bg-center p-8 sm:p-10"
            style={{ backgroundImage: `linear-gradient(135deg, rgba(45,34,26,0.5), rgba(45,34,26,0.18)), url(${event.heroImage})` }}
          >
            <Badge className="bg-[rgba(245,239,227,0.16)] text-[var(--paper)]">
              {event.organizer}
            </Badge>
          </div>
          <div className="grid gap-5 px-8 pb-8">
            <div>
              <h1 className="font-display text-5xl">{event.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                {event.description}
              </p>
            </div>
            <div className="grid gap-4 text-sm text-[var(--muted-foreground)] sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(event.date)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.venue}
              </p>
              <p className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {event.categories.length} categories
              </p>
            </div>
          </div>
        </Card>

        <Card className="grid gap-5">
          <Badge className="w-fit">Checkout summary</Badge>
          {selectedCategory ? (
            <>
              <div>
                <h2 className="font-display text-3xl">{selectedCategory.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  Choose your quantity, then continue with the checkout style that matches
                  the course subject.
                </p>
              </div>

              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={Math.max(1, selectedCategory.maxSupply - selectedCategory.mintedCount)}
              />

              <div className="grid gap-4 rounded-[24px] bg-[var(--background-soft)] p-5">
                <SummaryLine
                  label="Category"
                  value={selectedCategory.name}
                />
                <SummaryLine
                  label="ETH total"
                  value={formatEth(selectedCategory.priceEth * quantity)}
                />
                <SummaryLine
                  label="Card total"
                  value={formatEur(selectedCategory.priceEur * quantity)}
                />
                <SummaryLine
                  label="Remaining"
                  value={`${selectedCategory.maxSupply - selectedCategory.mintedCount}`}
                />
              </div>

              <div className="grid gap-3">
                <Button className="gap-2" onClick={() => goToCheckout('/checkout/eth')}>
                  <Wallet className="h-4 w-4" />
                  Continue with ETH
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => goToCheckout('/checkout/card')}
                >
                  <CreditCard className="h-4 w-4" />
                  Continue with fake card
                </Button>
              </div>
            </>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Live categories
          </p>
          <h2 className="font-display text-4xl">Pick the ticket category before checkout</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {event.categories.map((category: TicketCategory) => (
            <TicketCategoryCard
              key={category.id}
              category={category}
              isSelected={category.id === selectedCategoryId}
              onSelect={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </div>
      </section>
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
