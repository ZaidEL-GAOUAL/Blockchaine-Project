"""Event use cases.

Pure business logic. Depends only on ports, never on concrete infrastructure.
The slug-based ID generation keeps event and category IDs human-readable and
consistent across the stack.
"""

from __future__ import annotations

import re

from app.domain.models import (
    CardCheckoutPayload,
    CreateCategoryPayload,
    CreateEventPayload,
    Event,
    TicketCategory,
)
from app.domain.ports import ContractDeployer, EventRepository


class EventNotFoundError(Exception):
    """Raised when an event id does not exist."""


class TicketCategoryNotFoundError(Exception):
    """Raised when a ticket category id does not exist for an event."""


class TicketSupplyError(Exception):
    """Raised when a purchase would exceed category supply."""


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

    async def create_category(
        self, event_id: str, payload: CreateCategoryPayload
    ) -> TicketCategory:
        # Fails with EventNotFoundError if the event does not exist.
        event = await self.get_event(event_id)

        # Deploy the NFT contract for this category.
        contract_address = await self._deployer.deploy_ticket_contract(
            name=payload.name,
            symbol=payload.symbol,
            max_supply=payload.max_supply,
            metadata_uri=payload.metadata_uri,
            price_wei=eth_to_wei(payload.price_eth),
        )

        # Slug id: slugify("<eventId>-<name>").
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

    async def pay_by_card(self, payload: CardCheckoutPayload) -> str:
        event = await self.get_event(payload.event_id)
        category = next(
            (item for item in event.categories if item.id == payload.category_id),
            None,
        )

        if category is None:
            raise TicketCategoryNotFoundError(payload.category_id)

        if payload.quantity <= 0:
            raise TicketSupplyError("Quantity must be at least 1.")

        if category.minted_count + payload.quantity > category.max_supply:
            raise TicketSupplyError("Selected quantity exceeds remaining supply.")

        tx_hash = await self._deployer.mint_tickets(
            contract_address=category.contract_address,
            recipient=payload.wallet_address,
            quantity=payload.quantity,
        )
        await self._repo.increment_category_minted_count(
            payload.event_id,
            payload.category_id,
            payload.quantity,
        )
        return tx_hash
