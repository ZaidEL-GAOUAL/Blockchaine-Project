"""A simple in-memory EventRepository used as a test double.

It implements the same port as the Mongo repo, so the domain service and the
routes can run with zero external dependencies.
"""

from __future__ import annotations

from app.domain.models import Event, TicketCategory
from app.domain.ports import ContractDeployer, EventRepository


class FakeContractDeployer(ContractDeployer):
    """Returns a predictable fake address and records calls."""

    def __init__(
        self,
        address: str = "0xFAKEADDRESS",
        mint_tx_hash: str = "0xFAKEMINT",
    ) -> None:
        self.address = address
        self.mint_tx_hash = mint_tx_hash
        self.calls: list[dict] = []
        self.mint_calls: list[dict] = []

    async def deploy_ticket_contract(
        self,
        *,
        name: str,
        symbol: str,
        max_supply: int,
        metadata_uri: str,
        price_wei: int,
    ) -> str:
        self.calls.append(
            {
                "name": name,
                "symbol": symbol,
                "max_supply": max_supply,
                "metadata_uri": metadata_uri,
                "price_wei": price_wei,
            }
        )
        return self.address

    async def mint_tickets(
        self,
        *,
        contract_address: str,
        recipient: str,
        quantity: int,
    ) -> str:
        self.mint_calls.append(
            {
                "contract_address": contract_address,
                "recipient": recipient,
                "quantity": quantity,
            }
        )
        return self.mint_tx_hash


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

    async def increment_category_minted_count(
        self, event_id: str, category_id: str, quantity: int
    ) -> None:
        event = self._events[event_id]
        event.categories = [
            category.model_copy(
                update={"minted_count": category.minted_count + quantity}
            )
            if category.id == category_id
            else category
            for category in event.categories
        ]
