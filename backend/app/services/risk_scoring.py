from datetime import datetime, timedelta, timezone
from typing import Sequence, Optional, Tuple, Any

def account_security_score(account: Any) -> int:
    """
    Computes transparent, deterministic security checklist score for a digital account.
    - MFA enabled: 40 points
    - Recovery settings reviewed: 30 points
    - Account reviewed in the last 90 days: 30 points
    Total: 0 - 100 points
    """
    score = 40 if getattr(account, "mfa_enabled", False) else 0
    score += 30 if getattr(account, "recovery_reviewed", False) else 0

    reviewed_at = getattr(account, "last_reviewed_at", None)
    if reviewed_at is not None:
        if reviewed_at.tzinfo is None:
            reviewed_at = reviewed_at.replace(tzinfo=timezone.utc)
        if reviewed_at >= datetime.now(timezone.utc) - timedelta(days=90):
            score += 30

    return score


def calculate_dashboard_score(accounts: Sequence[Any]) -> Tuple[Optional[int], str]:
    """
    Calculates rounded average score across all user accounts.
    If there are no accounts, returns (None, "Add your first account").
    """
    if not accounts:
        return None, "Add your first account"

    total = sum(account_security_score(acc) for acc in accounts)
    avg_score = round(total / len(accounts))
    return avg_score, "Self-reported checklist score"

