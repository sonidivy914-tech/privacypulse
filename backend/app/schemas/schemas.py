from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# Categories & Enums
AccountCategory = Literal["social", "finance", "shopping", "work", "entertainment", "other"]
IncidentSeverity = Literal["low", "medium", "high"]
IncidentStatus = Literal["open", "investigating", "resolved"]

# User / Auth Schemas
class UserRead(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    timezone: str = "Asia/Kolkata"

# Digital Account Schemas
class AccountBase(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=100)
    category: AccountCategory = "other"
    mfa_enabled: bool = False
    recovery_reviewed: bool = False
    last_reviewed_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    service_name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[AccountCategory] = None
    mfa_enabled: Optional[bool] = None
    recovery_reviewed: Optional[bool] = None
    last_reviewed_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)

class AccountRead(AccountBase):
    id: str
    user_id: str
    score: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Checklist Item Schemas
class ChecklistCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field("general", max_length=50)

class ChecklistUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=50)
    completed: Optional[bool] = None

class ChecklistRead(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    category: str
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Reminder Schemas
class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    due_at: datetime
    account_id: Optional[str] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    due_at: Optional[datetime] = None
    account_id: Optional[str] = None
    completed: Optional[bool] = None

class ReminderRead(BaseModel):
    id: str
    user_id: str
    account_id: Optional[str]
    account_name: Optional[str] = None
    title: str
    due_at: datetime
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Incident Schemas
class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    severity: IncidentSeverity = "medium"
    occurred_at: Optional[datetime] = None
    status: IncidentStatus = "open"

class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    severity: Optional[IncidentSeverity] = None
    occurred_at: Optional[datetime] = None
    status: Optional[IncidentStatus] = None

class IncidentRead(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    severity: IncidentSeverity
    occurred_at: Optional[datetime]
    status: IncidentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard / Scoring Schemas
class DashboardSummary(BaseModel):
    account_count: int
    overall_score: Optional[int] = None
    score_label: str
    open_reminders_count: int
    open_incidents_count: int
    checklist_completion_ratio: float
    next_action: Optional[str] = None

