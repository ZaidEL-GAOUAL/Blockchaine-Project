"""Domain models.

These mirror the TypeScript interfaces in the frontend
(`src/shared/types/models.ts`). The API serialises to camelCase so the
existing frontend services can consume responses without any mapping layer.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serialises to camelCase but also accepts snake_case."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class TicketCategory(CamelModel):
    id: str
    event_id: str
    name: str
    symbol: str
    description: str = ""
    price_eth: float
    price_eur: float
    max_supply: int
    minted_count: int = 0
    metadata_uri: str = ""
    contract_address: str = ""
    benefits: list[str] = Field(default_factory=list)


class Event(CamelModel):
    id: str
    title: str
    organizer: str
    date: str
    venue: str
    description: str = ""
    hero_image: str = ""
    hero_eyebrow: str = ""
    categories: list[TicketCategory] = Field(default_factory=list)


# ---- Request payloads (match CreateEventPayload / CreateCategoryPayload) ----


class CreateEventPayload(CamelModel):
    title: str
    organizer: str
    date: str
    venue: str
    description: str = ""
    hero_image: str = ""


class CreateCategoryPayload(CamelModel):
    name: str
    symbol: str
    description: str = ""
    price_eth: float
    price_eur: float
    max_supply: int
    metadata_uri: str = ""
    benefits: list[str] = Field(default_factory=list)


class CardCheckoutPayload(CamelModel):
    event_id: str
    category_id: str
    quantity: int
    cardholder_name: str
    card_number: str
    expiration: str
    cvc: str
    wallet_address: str


# ---- Response shapes ----


class Deployment(CamelModel):
    contract_address: str
    symbol: str


class CreateCategoryResponse(CamelModel):
    """Matches what the frontend's api-client expects:
    `{ category: {...}, deployment: { contractAddress, symbol } }`.
    """

    category: TicketCategory
    deployment: Deployment


class CardCheckoutResponse(CamelModel):
    tx_hash: str
