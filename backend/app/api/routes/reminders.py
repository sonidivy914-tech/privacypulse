from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import Reminder, DigitalAccount
from app.schemas.schemas import ReminderCreate, ReminderUpdate, ReminderRead

router = APIRouter(prefix="/reminders", tags=["Reminders"])


def reminder_to_schema(reminder: Reminder, account_name: str | None = None) -> ReminderRead:
    return ReminderRead(
        id=reminder.id,
        user_id=reminder.user_id,
        account_id=reminder.account_id,
        account_name=account_name,
        title=reminder.title,
        due_at=reminder.due_at,
        completed=reminder.completed,
        created_at=reminder.created_at,
    )


@router.get("", response_model=List[ReminderRead])
def list_reminders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all reminders for current user, ordered by due date."""
    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id)
        .order_by(Reminder.due_at.asc())
        .all()
    )
    
    # Pre-fetch user's accounts to populate account_name
    accounts_map = {
        acc.id: acc.service_name
        for acc in db.query(DigitalAccount).filter(DigitalAccount.user_id == current_user.id).all()
    }
    
    return [
        reminder_to_schema(r, accounts_map.get(r.account_id) if r.account_id else None)
        for r in reminders
    ]


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: ReminderCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a reminder, validating that linked account belongs to current user."""
    account_name = None
    if data.account_id:
        account = (
            db.query(DigitalAccount)
            .filter(DigitalAccount.id == data.account_id, DigitalAccount.user_id == current_user.id)
            .first()
        )
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced account does not exist or does not belong to you",
            )
        account_name = account.service_name

    reminder = Reminder(
        user_id=current_user.id,
        account_id=data.account_id,
        title=data.title,
        due_at=data.due_at,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder_to_schema(reminder, account_name)


@router.patch("/{reminder_id}", response_model=ReminderRead)
def update_reminder(
    reminder_id: str,
    data: ReminderUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a reminder, validating account ownership if updated."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    update_dict = data.model_dump(exclude_unset=True)
    if "account_id" in update_dict and update_dict["account_id"] is not None:
        account = (
            db.query(DigitalAccount)
            .filter(DigitalAccount.id == update_dict["account_id"], DigitalAccount.user_id == current_user.id)
            .first()
        )
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced account does not exist or does not belong to you",
            )

    for field, value in update_dict.items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)
    
    account_name = None
    if reminder.account_id:
        acc = db.query(DigitalAccount).filter(DigitalAccount.id == reminder.account_id).first()
        account_name = acc.service_name if acc else None

    return reminder_to_schema(reminder, account_name)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return None

