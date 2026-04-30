"""API dependency functions"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_token
from typing import Optional

security = HTTPBearer()


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: Optional[dict] = Depends(security)) -> dict:
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.get("credentials") if isinstance(credentials, dict) else getattr(credentials, "credentials", None)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if user_id is None and payload.get("sub") is not None:
        try:
            user_id = int(payload["sub"])
        except (TypeError, ValueError):
            user_id = None

    client_id = payload.get("client_id")
    is_superadmin = bool(payload.get("is_superadmin", False))

    # Superadmin users have client_id=0 — allow that through
    if user_id is None or client_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "sub": str(user_id),
        "user_id": user_id,
        "client_id": int(client_id),
        "is_superadmin": is_superadmin,
    }


def get_superadmin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Require the authenticated user to be a superadmin."""
    if not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return current_user
