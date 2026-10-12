from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import DigitalAccount, ChecklistItem, Reminder, Incident
from app.services.risk_scoring import account_security_score, calculate_dashboard_score

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_report_summary(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns full privacy audit report summary for export and presentation.
    """
    accounts = (
        db.query(DigitalAccount)
        .filter(DigitalAccount.user_id == current_user.id)
        .order_by(DigitalAccount.service_name.asc())
        .all()
    )
    score, score_label = calculate_dashboard_score(accounts)

    checklist = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == current_user.id)
        .order_by(ChecklistItem.created_at.asc())
        .all()
    )

    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id)
        .order_by(Reminder.due_at.asc())
        .all()
    )

    incidents = (
        db.query(Incident)
        .filter(Incident.user_id == current_user.id)
        .order_by(Incident.created_at.desc())
        .all()
    )

    return {
        "user_id": current_user.id,
        "overall_score": score,
        "score_label": score_label,
        "accounts": [
            {
                "id": a.id,
                "service_name": a.service_name,
                "category": a.category,
                "mfa_enabled": a.mfa_enabled,
                "recovery_reviewed": a.recovery_reviewed,
                "last_reviewed_at": a.last_reviewed_at.isoformat() if a.last_reviewed_at else None,
                "score": account_security_score(a),
                "notes": a.notes,
            }
            for a in accounts
        ],
        "checklist": [
            {
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "completed": c.completed,
                "completed_at": c.completed_at.isoformat() if c.completed_at else None,
            }
            for c in checklist
        ],
        "reminders": [
            {
                "id": r.id,
                "title": r.title,
                "due_at": r.due_at.isoformat(),
                "completed": r.completed,
            }
            for r in reminders
        ],
        "incidents": [
            {
                "id": i.id,
                "title": i.title,
                "severity": i.severity,
                "status": i.status,
                "occurred_at": i.occurred_at.isoformat() if i.occurred_at else None,
            }
            for i in incidents
        ],
    }

