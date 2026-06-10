import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { formatDate } from '@/shared/lib/format'
import { eventsService } from '@/shared/services/events-service'
import type { Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'
import { TicketCategoryCard } from '@/shared/ui/ticket-category-card'

export function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    eventsService
      .listEvents()
      .then((response) => {
        if (!active) {
          return
        }

        setEvents(response)
        setStatus('success')
      })
      .catch((responseError: Error) => {
        if (!active) {
          return
        }

        setStatus('error')
        setError(responseError.message)
      })

    return () => {
      active = false
    }
  }, [])

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Preparing the buyer experience"
        description="Reading the featured event, ticket categories, and seller-created content from the mock event store."
      />
    )
  }

  if (status === 'error') {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="We could not load the featured event"
        description={error}
      />
    )
  }

  if (events.length === 0) {
    return (
      <StateBlock
        eyebrow="Empty"
        title="No events are live yet"
        description="Create the first event from the seller dashboard, then come back here to browse it like a buyer."
        action={
          <Link to="/seller">
            <Button>Open seller dashboard</Button>
          </Link>
        }
      />
    )
  }

  const featuredEvent = events[0]

  return (
    <div className="grid gap-8">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div
            className="relative min-h-[30rem] bg-cover bg-center p-8 sm:p-10"
            style={{ backgroundImage: `linear-gradient(135deg, rgba(45,34,26,0.7), rgba(45,34,26,0.38)), url(${featuredEvent.heroImage})` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(38,30,23,0.85))]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="grid gap-4">
                <Badge className="w-fit bg-[rgba(245,239,227,0.14)] text-[var(--paper)]">
                  {featuredEvent.heroEyebrow}
                </Badge>
                <div className="max-w-2xl">
                  <h1 className="font-display text-5xl leading-tight text-[var(--paper)] sm:text-6xl">
                    {featuredEvent.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-8 text-[rgba(245,239,227,0.82)]">
                    {featuredEvent.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 text-sm text-[rgba(245,239,227,0.88)]">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(featuredEvent.date)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {featuredEvent.venue}
                  </p>
                </div>

                <Link to={`/events/${featuredEvent.id}`}>
                  <Button className="gap-2">
                    Explore tickets
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="grid gap-5">
            <Badge className="w-fit">Project scope</Badge>
            <div>
              <h2 className="font-display text-3xl">Two clean buyer journeys</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                The frontend is structured so a buyer can purchase the same ticket category
                either with a wallet transaction in ETH or through a fake euro checkout that
                later maps to an owner-side mint.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--muted-foreground)]">
              <p>• Wallet-first ETH checkout with mocked transaction feedback</p>
              <p>• Fake card payment with wallet address capture</p>
              <p>• Seller screens for event setup and ticket-category deployment</p>
            </div>
          </Card>

          <Card className="grid gap-4 bg-[var(--foreground)] text-[var(--paper)]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[var(--highlight)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(245,239,227,0.72)]">
                Theme direction
              </p>
            </div>
            <h2 className="font-display text-3xl">Caffeine-inspired, warm, and editorial</h2>
            <p className="text-sm leading-7 text-[rgba(245,239,227,0.8)]">
              Soft cream surfaces, espresso panels, olive accents, rounded shapes, and high
              contrast typography keep the prototype feeling intentional without becoming
              visually heavy.
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Ticket categories
            </p>
            <h2 className="font-display text-4xl">Start with the passes buyers actually choose</h2>
          </div>
          <Link to={`/events/${featuredEvent.id}`} className="text-sm font-semibold text-[var(--accent)]">
            Open the full buyer page
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {featuredEvent.categories.map((category) => (
            <TicketCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  )
}
