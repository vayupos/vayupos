"""Authentication API routes"""
import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import AuthService
from app.schemas import (
    UserResponse,
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.models.invite_token import InviteToken
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", include_in_schema=False)
def register():
    """Self-registration is disabled. Use POST /api/v1/admin/register-restaurant."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Self-registration is disabled. Contact the administrator to create an account.",
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login user and get access token"""
    user = AuthService.authenticate_user(db, credentials.identifier, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Create tokens
    access_payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "client_id": user.client_id,
        "is_superadmin": user.is_superadmin,
    }
    access_token = create_access_token(data=access_payload)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "is_superadmin": user.is_superadmin,
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    user = AuthService.get_user_by_id(db, int(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password"""
    AuthService.change_password(
        db,
        int(current_user["user_id"]),
        payload.current_password,
        payload.new_password,
    )
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate forgot-password flow.
    Always returns generic response to prevent user enumeration.
    """
    AuthService.create_password_reset_token(db, payload.email)
    return {"message": "If this email is registered, you will receive a reset link"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with one-time reset token."""
    AuthService.reset_password(db, payload.token, payload.new_password)
    return {"message": "Password reset successfully"}


class AcceptInviteRequest(BaseModel):
    token: str
    username: str
    password: str
    full_name: str = ""


@router.post("/accept-invite", response_model=TokenResponse)
def accept_invite(payload: AcceptInviteRequest, db: Session = Depends(get_db)):
    """Accept a superadmin invite: set username + password and get a JWT back."""
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    invite = db.query(InviteToken).filter(
        InviteToken.token_hash == token_hash,
        InviteToken.used == False,
    ).first()

    if not invite or invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    normalized_username = payload.username.strip().lower()
    if db.query(User).filter(User.username == normalized_username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        client_id=invite.client_id,
        username=normalized_username,
        email=invite.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name or normalized_username,
        role=UserRole(invite.role) if invite.role in UserRole.__members__.values() else UserRole.CASHIER,
        is_active=True,
    )
    db.add(user)
    invite.used = True
    db.commit()
    db.refresh(user)

    token_payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "client_id": user.client_id,
        "is_superadmin": False,
    }
    return {
        "access_token": create_access_token(data=token_payload),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}),
        "token_type": "bearer",
        "is_superadmin": False,
    }
