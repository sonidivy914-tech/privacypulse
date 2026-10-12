import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.db.session import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type, otherwise uses CHAR(36).
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=False))
        return dialect.type_descriptor(CHAR(36))


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DigitalAccount(Base):
    __tablename__ = "digital_accounts"

    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, nullable=False, index=True)
    service_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default="other")
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    recovery_reviewed = Column(Boolean, nullable=False, default=False)
    last_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="general")
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, nullable=False, index=True)
    account_id = Column(GUID, ForeignKey("digital_accounts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="medium")  # low, medium, high
    occurred_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="open")      # open, investigating, resolved
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id = Column(GUID, primary_key=True)
    display_name = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

