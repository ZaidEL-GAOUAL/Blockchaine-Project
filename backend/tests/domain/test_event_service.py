import pytest

from app.domain.models import CreateEventPayload, Event
from app.domain.services import EventNotFoundError, EventService, slugify
from tests.fakes import FakeEventRepository


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
    service = EventService(FakeEventRepository())
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
    service = EventService(FakeEventRepository([existing]))
    event = await service.create_event(make_payload())
    assert event.id == "aurora-city-live-1"


async def test_get_event_raises_when_missing():
    service = EventService(FakeEventRepository())
    with pytest.raises(EventNotFoundError):
        await service.get_event("does-not-exist")
