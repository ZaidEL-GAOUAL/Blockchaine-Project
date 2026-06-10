"""Event use cases.

Pure business logic. Depends only on the EventRepository *port*, never on a
concrete implementation. The slug-based ID generation mirrors the frontend
mock (`slugify(title)`, with a numeric suffix on collision) so IDs stay
human-readable and consistent across the stack.
"""

from __future__ import annotations

import re

from app.domain.models import (
    CreateEventPayload,
    Event,
    TicketCategory,
)
from app.domain.ports import EventRepository


class EventNotFoundError(Exception):
    """Raised when an event id does not exist."""


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


class EventService:
    def __init__(self, repository: EventRepository) -> None:
        self._repo = repository

    async def list_events(self) -> list[Event]:
        return await self._repo.list_events()

    async def get_event(self, event_id: str) -> Event:
        event = await self._repo.get_event(event_id)
        if event is None:
            raise EventNotFoundError(event_id)
        return event

    async def list_categories(self, event_id: str) -> list[TicketCategory]:
        event = await self.get_event(event_id)
        return event.categories

    async def create_event(self, payload: CreateEventPayload) -> Event:
        base = slugify(payload.title) or "event"
        event_id = base
        suffix = 1
        while await self._repo.event_id_exists(event_id):
            event_id = f"{base}-{suffix}"
            suffix += 1

        event = Event(
            id=event_id,
            title=payload.title,
            organizer=payload.organizer,
            date=payload.date,
            venue=payload.venue,
            description=payload.description,
            hero_image=payload.hero_image,
            hero_eyebrow="New seller event",
            categories=[],
        )
        return await self._repo.insert_event(event)
