import pytest

from app.domain.models import (
    CardCheckoutPayload,
    CreateCategoryPayload,
    CreateEventPayload,
    Event,
    TicketCategory,
)
from app.domain.services import (
    EventNotFoundError,
    EventService,
    TicketCategoryNotFoundError,
    TicketSupplyError,
    slugify,
)
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


async def test_pay_by_card_mints_and_updates_supply():
    category = TicketCategory(
        id="aurora-general",
        event_id="aurora-city-live",
        name="General",
        symbol="GEN",
        price_eth=0.01,
        price_eur=10,
        max_supply=10,
        minted_count=1,
        contract_address="0x1111111111111111111111111111111111111111",
    )
    existing = Event(
        id="aurora-city-live",
        title="Aurora",
        organizer="x",
        date="x",
        venue="x",
        categories=[category],
    )
    repo = FakeEventRepository([existing])
    deployer = FakeContractDeployer(mint_tx_hash="0xMINTED")
    service = EventService(repo, deployer)

    tx_hash = await service.pay_by_card(
        CardCheckoutPayload(
            event_id="aurora-city-live",
            category_id="aurora-general",
            quantity=2,
            cardholder_name="Zaid",
            card_number="4242424242424242",
            expiration="09/28",
            cvc="123",
            wallet_address="0x2222222222222222222222222222222222222222",
        )
    )

    event = await service.get_event("aurora-city-live")

    assert tx_hash == "0xMINTED"
    assert deployer.mint_calls[0]["quantity"] == 2
    assert event.categories[0].minted_count == 3


async def test_pay_by_card_unknown_category_raises():
    existing = Event(
        id="aurora-city-live",
        title="Aurora",
        organizer="x",
        date="x",
        venue="x",
        categories=[],
    )
    service = EventService(FakeEventRepository([existing]), FakeContractDeployer())

    with pytest.raises(TicketCategoryNotFoundError):
        await service.pay_by_card(
            CardCheckoutPayload(
                event_id="aurora-city-live",
                category_id="missing",
                quantity=1,
                cardholder_name="Zaid",
                card_number="4242424242424242",
                expiration="09/28",
                cvc="123",
                wallet_address="0x2222222222222222222222222222222222222222",
            )
        )


async def test_pay_by_card_rejects_sold_out_category():
    category = TicketCategory(
        id="aurora-general",
        event_id="aurora-city-live",
        name="General",
        symbol="GEN",
        price_eth=0.01,
        price_eur=10,
        max_supply=1,
        minted_count=1,
        contract_address="0x1111111111111111111111111111111111111111",
    )
    existing = Event(
        id="aurora-city-live",
        title="Aurora",
        organizer="x",
        date="x",
        venue="x",
        categories=[category],
    )
    service = EventService(FakeEventRepository([existing]), FakeContractDeployer())

    with pytest.raises(TicketSupplyError):
        await service.pay_by_card(
            CardCheckoutPayload(
                event_id="aurora-city-live",
                category_id="aurora-general",
                quantity=1,
                cardholder_name="Zaid",
                card_number="4242424242424242",
                expiration="09/28",
                cvc="123",
                wallet_address="0x2222222222222222222222222222222222222222",
            )
        )
