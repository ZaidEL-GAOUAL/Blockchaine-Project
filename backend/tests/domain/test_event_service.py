import pytest

from app.domain.models import CreateCategoryPayload, CreateEventPayload, Event
from app.domain.services import EventNotFoundError, EventService, slugify
from tests.fakes import FakeContractDeployer, FakeEventRepository


def make_payload(title: str = "Aurora City Live") -> CreateEventPayload:
    return CreateEventPayload(
        title=title,
        organizer="Nova Nights",
        date="2026-09-18T20:30:00.000Z",
        venue="Grand Hall, Paris",
        description="demo",
        hero_image="https://example.com/x.jpg",
    )


def test_slugify():
    assert slugify("Aurora City Live") == "aurora-city-live"
    assert slugify("  Héllo  World!! ") == "h-llo-world"


async def test_create_event_generates_slug_id():
    service = EventService(FakeEventRepository(), FakeContractDeployer())
    event = await service.create_event(make_payload())
    assert event.id == "aurora-city-live"
    assert event.categories == []


async def test_create_event_dedupes_id_on_collision():
    existing = Event(
        id="aurora-city-live",
        title="x",
        organizer="x",
        date="x",
        venue="x",
    )
    service = EventService(FakeEventRepository([existing]), FakeContractDeployer())
    event = await service.create_event(make_payload())
    assert event.id == "aurora-city-live-1"


async def test_get_event_raises_when_missing():
    service = EventService(FakeEventRepository(), FakeContractDeployer())
    with pytest.raises(EventNotFoundError):
        await service.get_event("does-not-exist")

async def test_create_category_deploys_and_persists():
    existing = Event(
        id="aurora-city-live",
        title="Aurora",
        organizer="x",
        date="x",
        venue="x",
    )
    repo = FakeEventRepository([existing])
    deployer = FakeContractDeployer(address="0xABC123")
    service = EventService(repo, deployer)

    payload = CreateCategoryPayload(
        name="General Admission",
        symbol="AUR-GA",
        description="ga",
        price_eth=0.08,
        price_eur=49,
        max_supply=500,
        metadata_uri="ipfs://x",
        benefits=["NFT ticket"],
    )
    category = await service.create_category("aurora-city-live", payload)

    assert category.id == "aurora-city-live-general-admission"
    assert category.contract_address == "0xABC123"
    assert category.minted_count == 0
    # deployer was called with wei-converted price
    assert deployer.calls[0]["price_wei"] == 80_000_000_000_000_000
    assert deployer.calls[0]["metadata_uri"] == "ipfs://x"
    # persisted on the event
    event = await service.get_event("aurora-city-live")
    assert event.categories[0].id == category.id


async def test_create_category_unknown_event_raises():
    service = EventService(FakeEventRepository(), FakeContractDeployer())
    payload = CreateCategoryPayload(
        name="X", symbol="X", price_eth=0.1, price_eur=80, max_supply=10
    )
    with pytest.raises(EventNotFoundError):
        await service.create_category("nope", payload)
