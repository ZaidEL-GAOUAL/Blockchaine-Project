import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { eventsService } from '@/shared/services/events-service'
import type { CreateEventPayload, Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input, Textarea } from '@/shared/ui/field'

interface EventErrors {
  title?: string
  organizer?: string
  date?: string
  venue?: string
}

const initialForm: CreateEventPayload = {
  title: '',
  organizer: '',
  date: '',
  venue: '',
  description: '',
  heroImage:
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
}

export function CreateEventPage() {
  const [form, setForm] = useState<CreateEventPayload>(initialForm)
  const [errors, setErrors] = useState<EventErrors>({})
  const [requestError, setRequestError] = useState('')
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<Key extends keyof CreateEventPayload>(
    key: Key,
    value: CreateEventPayload[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateForm() {
    const nextErrors: EventErrors = {}
    if (!form.title.trim()) {
      nextErrors.title = 'Event title is required.'
    }
    if (!form.organizer.trim()) {
      nextErrors.organizer = 'Organizer name is required.'
    }
    if (!form.date) {
      nextErrors.date = 'Event date is required.'
    }
    if (!form.venue.trim()) {
      nextErrors.venue = 'Venue is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()

    if (!validateForm()) {
      setRequestError('Please fill in the required event fields.')
      return
    }

    try {
      setRequestError('')
      setIsSubmitting(true)
      const response = await eventsService.createEvent(form)
      setCreatedEvent(response)
      setForm(initialForm)
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error ? responseError.message : 'Event creation failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <Card className="grid gap-5">
        <Badge className="w-fit">Seller form</Badge>
        <div>
          <h1 className="font-display text-4xl">Create an event</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Keep it simple for the project: define the buyer-facing event details now, then add
            ticket categories and mock contract deployment in the next screen.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Event title"
              placeholder="Aurora City Live"
              value={form.title}
              error={errors.title}
              onChange={(eventObject) => updateField('title', eventObject.target.value)}
            />
            <Input
              label="Organizer"
              placeholder="Nova Nights"
              value={form.organizer}
              error={errors.organizer}
              onChange={(eventObject) => updateField('organizer', eventObject.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Date and time"
              type="datetime-local"
              value={form.date}
              error={errors.date}
              onChange={(eventObject) => updateField('date', eventObject.target.value)}
            />
            <Input
              label="Venue"
              placeholder="Grand Hall, Paris"
              value={form.venue}
              error={errors.venue}
              onChange={(eventObject) => updateField('venue', eventObject.target.value)}
            />
          </div>
          <Input
            label="Hero image URL"
            hint="This can stay as a placeholder image for the frontend-only version."
            value={form.heroImage}
            onChange={(eventObject) => updateField('heroImage', eventObject.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="Describe the event, the atmosphere, and what buyers should expect."
            value={form.description}
            onChange={(eventObject) => updateField('description', eventObject.target.value)}
          />

          {requestError ? (
            <p className="rounded-2xl bg-[rgba(196,92,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {requestError}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating event...' : 'Create event'}
          </Button>
        </form>
      </Card>

      <Card className="grid gap-5">
        <Badge className="w-fit">What success looks like</Badge>
        {createdEvent ? (
          <>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
              <p className="font-semibold">Event created successfully</p>
            </div>
            <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5 text-sm">
              <SummaryLine label="Event ID" value={createdEvent.id} />
              <SummaryLine label="Organizer" value={createdEvent.organizer} />
              <SummaryLine label="Venue" value={createdEvent.venue} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/seller/events/${createdEvent.id}/categories/new`}>
                <Button>Add first ticket category</Button>
              </Link>
              <Link to="/seller">
                <Button variant="secondary">Back to seller dashboard</Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid gap-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <p>• The event becomes immediately visible in the seller dashboard.</p>
            <p>• Buyer pages can already render the event, even before categories are added.</p>
            <p>• The next step is creating a ticket category and showing its mock deployed address.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-right font-semibold text-[var(--foreground)]">{value}</span>
    </div>
  )
}
