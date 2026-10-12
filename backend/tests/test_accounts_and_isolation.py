from tests.conftest import create_test_jwt


def test_accounts_crud_and_two_user_isolation(client):
    """
    Tests CRUD for digital accounts and strictly verifies two-user isolation:
    User A cannot see, modify, or delete User B's accounts.
    """
    token_user_a = create_test_jwt(user_id="user-a-111", email="a@privacy.org")
    token_user_b = create_test_jwt(user_id="user-b-222", email="b@privacy.org")

    headers_a = {"Authorization": f"Bearer {token_user_a}"}
    headers_b = {"Authorization": f"Bearer {token_user_b}"}

    # 1. User A creates an account
    create_payload = {
        "service_name": "ProtonMail",
        "category": "social",
        "mfa_enabled": True,
        "recovery_reviewed": True,
        "notes": "Primary encrypted mailbox",
    }
    create_res = client.post("/api/v1/accounts", json=create_payload, headers=headers_a)
    assert create_res.status_code == 201
    account_a = create_res.json()
    account_a_id = account_a["id"]
    assert account_a["service_name"] == "ProtonMail"
    assert account_a["user_id"] == "user-a-111"

    # 2. User A can list their account
    list_a = client.get("/api/v1/accounts", headers=headers_a)
    assert list_a.status_code == 200
    assert len(list_a.json()) == 1
    assert list_a.json()[0]["id"] == account_a_id

    # 3. User B lists accounts -> empty list (isolation check!)
    list_b = client.get("/api/v1/accounts", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # 4. User B attempts to access User A's account -> 404 (non-disclosing check!)
    get_b = client.get(f"/api/v1/accounts/{account_a_id}", headers=headers_b)
    assert get_b.status_code == 404

    # 5. User B attempts to patch User A's account -> 404
    patch_b = client.patch(
        f"/api/v1/accounts/{account_a_id}",
        json={"service_name": "HackedName"},
        headers=headers_b,
    )
    assert patch_b.status_code == 404

    # 6. User B attempts to delete User A's account -> 404
    del_b = client.delete(f"/api/v1/accounts/{account_a_id}", headers=headers_b)
    assert del_b.status_code == 404

    # 7. User A can successfully patch their own account
    patch_a = client.patch(
        f"/api/v1/accounts/{account_a_id}",
        json={"notes": "Updated note"},
        headers=headers_a,
    )
    assert patch_a.status_code == 200
    assert patch_a.json()["notes"] == "Updated note"

    # 8. User A can delete their own account
    del_a = client.delete(f"/api/v1/accounts/{account_a_id}", headers=headers_a)
    assert del_a.status_code == 204

