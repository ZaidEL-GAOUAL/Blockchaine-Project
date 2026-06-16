import { ArrowRight, CalendarDays, Plus, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDate } from '@/shared/lib/format'
import { eventsService } from '@/shared/services/events-service'
import type { Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { StateBlock } from '@/shared/ui/state-block'

export function SellerDashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function syncEvents() {
      try {
        const response = await eventsService.listEvents()

        if (active) {
          setEvents(response)
          setStatus('success')
        }
      } catch (responseError) {
        if (active) {
          setStatus('error')
          setError(
            responseError instanceof Error
              ? responseError.message
              : 'Could not load seller events.',
          )
        }
      }
    }

    void syncEvents()

    const unsubscribe = eventsService.subscribe(() => {
      void syncEvents()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Preparing the seller dashboard"
        description="Fetching the event list, deployed categories, and creation state from the API."
      />
    )
  }

  if (status === 'error') {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="Seller data could not be loaded"
        description={error}
      />
    )
  }

  return (
    <div className="grid gap-8">
      <Card className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3">
          <Badge className="w-fit">Seller workspace</Badge>
          <div>
            <h1 className="font-display text-4xl">Create events and deploy categories</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              This side of the frontend covers the smallest clean seller workflow in the PDF:
              create an event, add ticket categories, and surface their deployed contract
              addresses for later blockchain integration.
            </p>
          </div>
        </div>

        <Link to="/seller/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create new event
          </Button>
        </Link>
      </Card>

      {events.length === 0 ? (
        <StateBlock
          eyebrow="Empty"
          title="No seller events exist yet"
          description="Start with one event and then add one or two categories to cover the required buyer flows."
          action={
            <Link to="/seller/events/new">
              <Button>Create your first event</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {event.organizer}
                  </p>
                  <h2 className="mt-2 font-display text-3xl">{event.title}</h2>
                </div>
                <Badge>{event.categories.length} categories</Badge>
              </div>

              <div className="grid gap-3 text-sm text-[var(--muted-foreground)]">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(event.date)}
                </p>
                <p>{event.venue}</p>
                <p className="leading-7">{event.description}</p>
              </div>

              <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5">
                {event.categories.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No categories deployed yet.
                  </p>
                ) : (
                  event.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{category.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          {category.symbol}
                        </p>
                      </div>
                      <div className="text-right text-xs text-[var(--muted-foreground)]">
                        <p>{category.mintedCount} minted</p>
                        <p>{category.maxSupply} max</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={`/events/${event.id}`}>
                  <Button variant="secondary" className="gap-2">
                    <Ticket className="h-4 w-4" />
                    View buyer page
                  </Button>
                </Link>
                <Link to={`/seller/events/${event.id}/categories/new`}>
                  <Button className="gap-2">
                    Add category
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
