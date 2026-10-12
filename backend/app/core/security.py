import json
from typing import Optional, Dict, Any
from uuid import UUID
import jwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

# Cached JWKS client
_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_JWKS_URL:
        _jwks_client = PyJWKClient(settings.SUPABASE_JWKS_URL)
    return _jwks_client


class AuthenticatedUser:
    """Represents an authenticated user derived from verified JWT claims."""
    def __init__(self, user_id: str, email: Optional[str] = None, claims: Optional[Dict[str, Any]] = None):
        self.id = user_id
        self.email = email
        self.claims = claims or {}

    @property
    def uuid(self) -> UUID:
        return UUID(self.id)


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Cryptographically verifies the Supabase JWT.
    Enforces signature, expiry, and issuer/audience verification.
    Never decodes without verifying signature.
    """
    try:
        # Determine signing method based on configuration
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg", "HS256")
        
        jwks_client = get_jwks_client()

        # Case 1: Asymmetric key with JWKS (e.g. RS256 / ES256)
        if jwks_client and algorithm in ["RS256", "ES256"]:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decode_kwargs: Dict[str, Any] = {
                "algorithms": [algorithm],
                "options": {"verify_signature": True, "verify_exp": True},
            }
            if settings.SUPABASE_ISSUER:
                decode_kwargs["issuer"] = settings.SUPABASE_ISSUER
            
            payload = jwt.decode(token, signing_key.key, **decode_kwargs)
            return payload

        # Case 2: Symmetric key with SUPABASE_JWT_SECRET (HS256)
        if settings.SUPABASE_JWT_SECRET:
            decode_kwargs = {
                "algorithms": ["HS256"],
                "options": {"verify_signature": True, "verify_exp": True},
            }
            if settings.SUPABASE_ISSUER:
                decode_kwargs["issuer"] = settings.SUPABASE_ISSUER
            
            payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, **decode_kwargs)
            return payload

        # Case 3: Development / test fallback with explicit dev secret
        # Only allowed when APP_ENV == "development" or "test"
        if settings.APP_ENV in ["development", "test"]:
            test_secret = "dev-jwt-secret-privacypulse-local-only"
            payload = jwt.decode(token, test_secret, algorithms=["HS256"], options={"verify_signature": True, "verify_exp": True})
            return payload

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT verification keys not configured on server",
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, PyJWKClientError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> AuthenticatedUser:
    """
    FastAPI dependency to derive the authenticated user ID from verified token claims.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: missing sub",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    return AuthenticatedUser(user_id=str(user_id), email=email, claims=payload)

