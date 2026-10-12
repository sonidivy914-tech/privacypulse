from datetime import datetime, timezone, timedelta
from app.services.risk_scoring import account_security_score, calculate_dashboard_score
from tests.conftest import create_test_jwt


class MockAccount:
    def __init__(self, mfa=False, recovery=False, last_reviewed=None):
        self.mfa_enabled = mfa
        self.recovery_reviewed = recovery
        self.last_reviewed_at = last_reviewed


def test_scoring_weights():
    # Base: 0
    acc = MockAccount()
    assert account_security_score(acc) == 0

    # MFA only: 40
    acc.mfa_enabled = True
    assert account_security_score(acc) == 40

    # Recovery only: 30
    acc.mfa_enabled = False
    acc.recovery_reviewed = True
    assert account_security_score(acc) == 30

    # Reviewed recently (within 90 days): 30
    acc.recovery_reviewed = False
    acc.last_reviewed_at = datetime.now(timezone.utc) - timedelta(days=10)
    assert account_security_score(acc) == 30

    # All criteria: 40 + 30 + 30 = 100
    acc.mfa_enabled = True
    acc.recovery_reviewed = True
    assert account_security_score(acc) == 100

    # Review older than 90 days: does not get the 30 pts
    acc.last_reviewed_at = datetime.now(timezone.utc) - timedelta(days=95)
    assert account_security_score(acc) == 70


def test_dashboard_score_empty():
    score, label = calculate_dashboard_score([])
    assert score is None
    assert label == "Add your first account"


def test_dashboard_api(client):
    token = create_test_jwt(user_id="user-dashboard-1")
    headers = {"Authorization": f"Bearer {token}"}

    # When no accounts exist
    res = client.get("/api/v1/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["account_count"] == 0
    assert data["overall_score"] is None
    assert data["score_label"] == "Add your first account"

