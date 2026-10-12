from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import ChecklistItem
from app.schemas.schemas import ChecklistCreate, ChecklistUpdate, ChecklistRead

router = APIRouter(prefix="/checklist", tags=["Checklist"])


@router.get("", response_model=List[ChecklistRead])
def list_checklist_items(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all privacy checklist items for the authenticated user."""
    items = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == current_user.id)
        .order_by(ChecklistItem.created_at.asc())
        .all()
    )
    return items


@router.post("", response_model=ChecklistRead, status_code=status.HTTP_201_CREATED)
def create_checklist_item(
    data: ChecklistCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new privacy checklist item."""
    item = ChecklistItem(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        category=data.category,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ChecklistRead)
def update_checklist_item(
    item_id: str,
    data: ChecklistUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a checklist item (e.g. toggle completion)."""
    item = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.id == item_id, ChecklistItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    update_dict = data.model_dump(exclude_unset=True)
    if "completed" in update_dict:
        if update_dict["completed"]:
            item.completed_at = datetime.now(timezone.utc)
        else:
            item.completed_at = None

    for field, value in update_dict.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a checklist item."""
    item = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.id == item_id, ChecklistItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    db.delete(item)
    db.commit()
    return None

