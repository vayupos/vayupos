"""Authentication API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import AuthService
from app.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core.security import create_access_token, create_refresh_token

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
