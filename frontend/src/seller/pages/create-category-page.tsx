import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { eventsService } from '@/shared/services/events-service'
import type { CreateCategoryPayload, Event } from '@/shared/types/models'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input, Textarea } from '@/shared/ui/field'
import { StateBlock } from '@/shared/ui/state-block'

interface CategoryErrors {
  name?: string
  symbol?: string
  maxSupply?: string
  priceEth?: string
  metadataUri?: string
}

const initialForm: CreateCategoryPayload = {
  name: '',
  symbol: '',
  description: '',
  priceEth: 0.05,
  priceEur: 39,
  maxSupply: 100,
  metadataUri: 'ipfs://new-event/category',
  benefits: ['Collectible NFT ticket', 'On-chain ownership'],
}

export function CreateCategoryPage() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [requestError, setRequestError] = useState('')
  const [errors, setErrors] = useState<CategoryErrors>({})
  const [form, setForm] = useState<CreateCategoryPayload>(initialForm)
  const [createdContract, setCreatedContract] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    eventsService
      .getEvent(eventId)
      .then((response) => {
        if (active) {
          setEvent(response)
          setStatus('success')
        }
      })
      .catch((responseError: Error) => {
        if (active) {
          setStatus('error')
          setRequestError(responseError.message)
        }
      })

    return () => {
      active = false
    }
  }, [eventId])

  function updateField<Key extends keyof CreateCategoryPayload>(
    key: Key,
    value: CreateCategoryPayload[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateForm() {
    const nextErrors: CategoryErrors = {}
    if (!form.name.trim()) {
      nextErrors.name = 'Category name is required.'
    }
    if (!form.symbol.trim()) {
      nextErrors.symbol = 'Ticker-like symbol is required.'
    }
    if (form.maxSupply <= 0) {
      nextErrors.maxSupply = 'Max supply must be above zero.'
    }
    if (form.priceEth <= 0) {
      nextErrors.priceEth = 'ETH price must be above zero.'
    }
    if (!form.metadataUri.trim()) {
      nextErrors.metadataUri = 'Metadata URI is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()

    if (!validateForm()) {
      setRequestError('Please fix the category form before deploying.')
      return
    }

    try {
      setRequestError('')
      setIsSubmitting(true)
      const response = await eventsService.createCategory(eventId, form)
      setCreatedContract(response.deployment.contractAddress)
      setForm(initialForm)
    } catch (responseError) {
      setRequestError(
        responseError instanceof Error
          ? responseError.message
          : 'Category deployment failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <StateBlock
        eyebrow="Loading"
        title="Preparing the category deployment form"
        description="Fetching the target event before defining the ticket category and deploying its contract."
      />
    )
  }

  if (status === 'error' || !event) {
    return (
      <StateBlock
        eyebrow="Request failure"
        title="The seller category form could not be prepared"
        description={requestError}
      />
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <Card className="grid gap-5">
        <Badge className="w-fit">Ticket category</Badge>
        <div>
          <h1 className="font-display text-4xl">Deploy a category for {event.title}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            One ticket category equals one NFT contract in the project assumptions, so this
            form can call the backend deployer when `VITE_API_BASE_URL` is configured.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Category name"
              placeholder="VIP Balcony"
              value={form.name}
              error={errors.name}
              onChange={(eventObject) => updateField('name', eventObject.target.value)}
            />
            <Input
              label="Symbol"
              placeholder="VIP-BAL"
              value={form.symbol}
              error={errors.symbol}
              onChange={(eventObject) => updateField('symbol', eventObject.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Price in ETH"
              type="number"
              min="0"
              step="0.01"
              value={String(form.priceEth)}
              error={errors.priceEth}
              onChange={(eventObject) =>
                updateField('priceEth', Number(eventObject.target.value))
              }
            />
            <Input
              label="Price in EUR"
              type="number"
              min="0"
              step="1"
              value={String(form.priceEur)}
              onChange={(eventObject) =>
                updateField('priceEur', Number(eventObject.target.value))
              }
            />
            <Input
              label="Max supply"
              type="number"
              min="1"
              step="1"
              value={String(form.maxSupply)}
              error={errors.maxSupply}
              onChange={(eventObject) =>
                updateField('maxSupply', Number(eventObject.target.value))
              }
            />
          </div>

          <Input
            label="Metadata URI"
            placeholder="ipfs://collection/category"
            value={form.metadataUri}
            error={errors.metadataUri}
            onChange={(eventObject) => updateField('metadataUri', eventObject.target.value)}
          />

          <Textarea
            label="Category description"
            placeholder="Describe what makes this pass different from the others."
            value={form.description}
            onChange={(eventObject) => updateField('description', eventObject.target.value)}
          />

          <Input
            label="Benefits"
            hint="Separate each benefit with a comma."
            value={form.benefits.join(', ')}
            onChange={(eventObject) =>
              updateField(
                'benefits',
                eventObject.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />

          {requestError ? (
            <p className="rounded-2xl bg-[rgba(196,92,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {requestError}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Deploying category...' : 'Create category and deploy contract'}
          </Button>
        </form>
      </Card>

      <Card className="grid gap-5">
        <Badge className="w-fit">Deployment result</Badge>
        {createdContract ? (
          <>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
              <p className="font-semibold">Contract address received</p>
            </div>
            <div className="grid gap-3 rounded-[24px] bg-[var(--background-soft)] p-5 text-sm">
              <SummaryLine label="Event" value={event.title} />
              <SummaryLine label="Contract address" value={createdContract} />
              <SummaryLine label="Creation state" value="Ready for buyer flows" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/events/${event.id}`}>
                <Button>Open buyer page</Button>
              </Link>
              <Link to="/seller">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid gap-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <p>• The deployed address is shown immediately after creation.</p>
            <p>• The new category becomes available on the buyer event page.</p>
            <p>• With `VITE_API_BASE_URL`, this form calls the backend deployer endpoint.</p>
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
      <span className="max-w-[16rem] break-all text-right font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}
