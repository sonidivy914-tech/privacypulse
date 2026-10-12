from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import get_db
from app.models.models import DigitalAccount, ChecklistItem, Reminder, Incident
from app.schemas.schemas import DashboardSummary
from app.services.risk_scoring import calculate_dashboard_score

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns high-level statistics and explainable self-reported score.
    """
    accounts = db.query(DigitalAccount).filter(DigitalAccount.user_id == current_user.id).all()
    score, score_label = calculate_dashboard_score(accounts)

    open_reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id, Reminder.completed == False)
        .count()
    )

    open_incidents = (
        db.query(Incident)
        .filter(
            Incident.user_id == current_user.id,
            Incident.status.in_(["open", "investigating"]),
        )
        .count()
    )

    total_checklist = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == current_user.id)
        .count()
    )
    completed_checklist = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == current_user.id, ChecklistItem.completed == True)
        .count()
    )
    completion_ratio = (
        (completed_checklist / total_checklist) if total_checklist > 0 else 0.0
    )

    # Calculate next recommended action
    next_action = "All accounts are actively reviewed"
    if len(accounts) == 0:
        next_action = "Add your first digital account to begin tracking security posture"
    else:
        accounts_no_mfa = [a for a in accounts if not a.mfa_enabled]
        if accounts_no_mfa:
            next_action = f"Enable MFA on {accounts_no_mfa[0].service_name}"
        else:
            accounts_no_recovery = [a for a in accounts if not a.recovery_reviewed]
            if accounts_no_recovery:
                next_action = f"Review recovery codes/options for {accounts_no_recovery[0].service_name}"
            elif open_reminders > 0:
                next_action = "Complete pending review reminders"

    return DashboardSummary(
        account_count=len(accounts),
        overall_score=score,
        score_label=score_label,
        open_reminders_count=open_reminders,
        open_incidents_count=open_incidents,
        checklist_completion_ratio=round(completion_ratio, 2),
        next_action=next_action,
    )

