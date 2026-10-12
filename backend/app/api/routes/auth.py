from datetime import datetime, timezone, timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import UserPreferences
from app.schemas.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


class DevTokenRequest(BaseModel):
    user_id: str = "demo-user-default"
    email: str = "demo@privacypulse.local"


@router.post("/dev-token")
def issue_dev_token(req: DevTokenRequest):
    """
    Issues a signed development token for local demo and sandbox testing.
    Disabled in production.
    """
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Disabled in production")

    payload = {
        "sub": req.user_id,
        "email": req.email,
        "role": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, "dev-jwt-secret-privacypulse-local-only", algorithm="HS256")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": req.user_id,
        "email": req.email,
    }


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns current authenticated user details and preferences.
    """
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id, timezone="Asia/Kolkata")
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return UserRead(
        id=current_user.id,
        email=current_user.email,
        display_name=prefs.display_name,
        timezone=prefs.timezone,
    )

