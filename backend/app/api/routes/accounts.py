from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import DigitalAccount
from app.schemas.schemas import AccountCreate, AccountUpdate, AccountRead
from app.services.risk_scoring import account_security_score

router = APIRouter(prefix="/accounts", tags=["Digital Accounts"])


def account_to_schema(account: DigitalAccount) -> AccountRead:
    score = account_security_score(account)
    return AccountRead(
        id=account.id,
        user_id=account.user_id,
        service_name=account.service_name,
        category=account.category,  # type: ignore
        mfa_enabled=account.mfa_enabled,
        recovery_reviewed=account.recovery_reviewed,
        last_reviewed_at=account.last_reviewed_at,
        notes=account.notes,
        score=score,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.get("", response_model=List[AccountRead])
def list_accounts(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all digital accounts owned by the authenticated user."""
    accounts = (
        db.query(DigitalAccount)
        .filter(DigitalAccount.user_id == current_user.id)
        .order_by(DigitalAccount.created_at.desc())
        .all()
    )
    return [account_to_schema(acc) for acc in accounts]


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new digital account scoped to the authenticated user."""
    account = DigitalAccount(
        user_id=current_user.id,
        service_name=data.service_name,
        category=data.category,
        mfa_enabled=data.mfa_enabled,
        recovery_reviewed=data.recovery_reviewed,
        last_reviewed_at=data.last_reviewed_at,
        notes=data.notes,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account_to_schema(account)


@router.get("/{account_id}", response_model=AccountRead)
def get_account(
    account_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve an account by ID, scoped to the current user."""
    account = (
        db.query(DigitalAccount)
        .filter(DigitalAccount.id == account_id, DigitalAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account_to_schema(account)


@router.patch("/{account_id}", response_model=AccountRead)
def update_account(
    account_id: str,
    data: AccountUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an account by ID, scoped to the current user."""
    account = (
        db.query(DigitalAccount)
        .filter(DigitalAccount.id == account_id, DigitalAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account_to_schema(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an account by ID, scoped to the current user."""
    account = (
        db.query(DigitalAccount)
        .filter(DigitalAccount.id == account_id, DigitalAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    db.delete(account)
    db.commit()
    return None

