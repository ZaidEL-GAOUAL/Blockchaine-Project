"""Ports: abstract interfaces the domain depends on.

The domain layer declares *what* it needs (these ABCs); the infrastructure
layer provides *how* (Mongo, in-memory, etc.). This is what makes the
services trivially testable with mocks / fakes and satisfies the
"dependency injection" expectation from the subject.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import Event, TicketCategory


class EventRepository(ABC):
    @abstractmethod
    async def list_events(self) -> list[Event]: ...

    @abstractmethod
    async def get_event(self, event_id: str) -> Event | None: ...

    @abstractmethod
    async def event_id_exists(self, event_id: str) -> bool: ...

    @abstractmethod
    async def insert_event(self, event: Event) -> Event: ...

    @abstractmethod
    async def add_category(
        self, event_id: str, category: TicketCategory
    ) -> TicketCategory: ...
