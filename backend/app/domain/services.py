"""Event use cases.

Pure business logic. Depends only on the EventRepository *port*, never on a
concrete implementation. The slug-based ID generation mirrors the frontend
mock (`slugify(title)`, with a numeric suffix on collision) so IDs stay
human-readable and consistent across the stack.
"""

from __future__ import annotations

import re

from app.domain.models import (
    CreateCategoryPayload,
    CreateEventPayload,
    Event,
    TicketCategory,
)
from app.domain.ports import ContractDeployer, ContractDeploymentError, EventRepository


class EventNotFoundError(Exception):
    """Raised when an event id does not exist."""


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def eth_to_wei(amount_eth: float) -> int:
    return int(round(amount_eth * 10**18))


class EventService:
    def __init__(
        self,
        repository: EventRepository,
        deployer: ContractDeployer,
    ) -> None:
        self._repo = repository
        self._deployer = deployer

    async def list_events(self) -> list[Event]:
        events = await self._repo.list_events()
        return [await self._with_live_minted_counts(event) for event in events]

    async def get_event(self, event_id: str) -> Event:
        event = await self._repo.get_event(event_id)
        if event is None:
            raise EventNotFoundError(event_id)
        return await self._with_live_minted_counts(event)

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

    async def create_category(
        self, event_id: str, payload: CreateCategoryPayload
    ) -> TicketCategory:
        # Fails with EventNotFoundError if the event does not exist.
        event = await self.get_event(event_id)

        # Deploy the NFT contract (placeholder today, real web3.py later).
        contract_address = await self._deployer.deploy_ticket_contract(
            name=payload.name,
            symbol=payload.symbol,
            max_supply=payload.max_supply,
            metadata_uri=payload.metadata_uri,
            price_wei=eth_to_wei(payload.price_eth),
        )

        # Slug id, mirroring the frontend mock: slugify("<eventId>-<name>").
        base = slugify(f"{event_id}-{payload.name}") or "category"
        category_id = base
        suffix = 1
        existing_ids = {c.id for c in event.categories}
        while category_id in existing_ids:
            category_id = f"{base}-{suffix}"
            suffix += 1

        category = TicketCategory(
            id=category_id,
            event_id=event_id,
            name=payload.name,
            symbol=payload.symbol,
            description=payload.description,
            price_eth=payload.price_eth,
            price_eur=payload.price_eur,
            max_supply=payload.max_supply,
            minted_count=0,
            metadata_uri=payload.metadata_uri,
            contract_address=contract_address,
            benefits=payload.benefits,
        )
        return await self._repo.add_category(event_id, category)

    async def _with_live_minted_counts(self, event: Event) -> Event:
        if not event.categories:
            return event

        categories: list[TicketCategory] = []
        for category in event.categories:
            live_minted_count = await self._read_live_minted_count(category)
            if live_minted_count is None:
                categories.append(category)
                continue

            categories.append(
                category.model_copy(
                    update={
                        "minted_count": min(
                            category.max_supply,
                            max(category.minted_count, live_minted_count),
                        )
                    }
                )
            )

        return event.model_copy(update={"categories": categories})

    async def _read_live_minted_count(self, category: TicketCategory) -> int | None:
        if not category.contract_address:
            return None

        try:
            return await self._deployer.get_minted_count(
                contract_address=category.contract_address
            )
        except ContractDeploymentError:
            return None
