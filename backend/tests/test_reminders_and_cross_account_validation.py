from datetime import datetime, timezone, timedelta
from tests.conftest import create_test_jwt


def test_reminder_account_ownership_validation(client):
    """
    Ensure a reminder cannot reference another user's account.
    """
    token_a = create_test_jwt(user_id="user-owner-1", email="owner@privacy.org")
    token_b = create_test_jwt(user_id="user-attacker-2", email="attacker@privacy.org")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an account
    acc_res = client.post(
        "/api/v1/accounts",
        json={"service_name": "Target Bank", "category": "finance"},
        headers=headers_a,
    )
    assert acc_res.status_code == 201
    account_a_id = acc_res.json()["id"]

    # User B tries to create a reminder referencing User A's account_id -> 400 Bad Request
    reminder_payload = {
        "title": "Review Bank MFA",
        "due_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "account_id": account_a_id,
    }
    rem_res = client.post("/api/v1/reminders", json=reminder_payload, headers=headers_b)
    assert rem_res.status_code == 400
    assert "Referenced account does not exist or does not belong to you" in rem_res.json()["detail"]

    # User A creates reminder referencing their own account -> 201 Created
    rem_owner_res = client.post("/api/v1/reminders", json=reminder_payload, headers=headers_a)
    assert rem_owner_res.status_code == 201
    assert rem_owner_res.json()["account_name"] == "Target Bank"

