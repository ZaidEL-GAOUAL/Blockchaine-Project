"""MongoDB implementation of the EventRepository port.

Events are stored as one document per event, with ticket categories embedded
as an array. This matches the nested shape the frontend expects from
`getEvent` (an Event carries its `categories`), and avoids joins entirely.

The Mongo `_id` is the slug event id, so lookups are direct.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.domain.models import Event, TicketCategory
from app.domain.ports import EventRepository


def _doc_to_event(doc: dict) -> Event:
    data = {**doc, "id": doc["_id"]}
    data.pop("_id", None)
    return Event.model_validate(data)


def _event_to_doc(event: Event) -> dict:
    data = event.model_dump(by_alias=False)
    data["_id"] = data.pop("id")
    return data


class MongoEventRepository(EventRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._events = db["events"]

    async def list_events(self) -> list[Event]:
        cursor = self._events.find({})
        return [_doc_to_event(doc) async for doc in cursor]

    async def get_event(self, event_id: str) -> Event | None:
        doc = await self._events.find_one({"_id": event_id})
        return _doc_to_event(doc) if doc else None

    async def event_id_exists(self, event_id: str) -> bool:
        return await self._events.count_documents({"_id": event_id}, limit=1) > 0

    async def insert_event(self, event: Event) -> Event:
        await self._events.insert_one(_event_to_doc(event))
        return event

    async def add_category(
        self, event_id: str, category: TicketCategory
    ) -> TicketCategory:
        result = await self._events.update_one(
            {"_id": event_id},
            {"$push": {"categories": category.model_dump(by_alias=False)}},
        )
        if result.matched_count == 0:
            raise KeyError(event_id)
        return category
