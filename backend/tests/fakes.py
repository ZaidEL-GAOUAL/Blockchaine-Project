"""A simple in-memory EventRepository used as a test double.

It implements the same port as the Mongo repo, so the domain service and the
routes can run with zero external dependencies.
"""

from __future__ import annotations

from app.domain.models import Event, TicketCategory
from app.domain.ports import EventRepository


class FakeEventRepository(EventRepository):
    def __init__(self, events: list[Event] | None = None) -> None:
        self._events: dict[str, Event] = {e.id: e for e in (events or [])}

    async def list_events(self) -> list[Event]:
        return list(self._events.values())

    async def get_event(self, event_id: str) -> Event | None:
        return self._events.get(event_id)

    async def event_id_exists(self, event_id: str) -> bool:
        return event_id in self._events

    async def insert_event(self, event: Event) -> Event:
        self._events[event.id] = event
        return event

    async def add_category(
        self, event_id: str, category: TicketCategory
    ) -> TicketCategory:
        self._events[event_id].categories.append(category)
        return category
