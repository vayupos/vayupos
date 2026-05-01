"""Users API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import AuthService
from app.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List users belonging to the current restaurant."""
    client_id = int(current_user["client_id"])
    users, total = AuthService.list_users_by_client(db, client_id, skip, limit)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [UserResponse.from_orm(u) for u in users],
    }


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a user — must belong to the same restaurant."""
    client_id = int(current_user["client_id"])
    user = AuthService.get_user_by_id(db, user_id)
    if not user or user.client_id != client_id:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a user — must belong to the same restaurant."""
    client_id = int(current_user["client_id"])
    user = AuthService.get_user_by_id(db, user_id)
    if not user or user.client_id != client_id:
        raise HTTPException(status_code=404, detail="User not found")
    return AuthService.update_user(db, user_id, user_update)


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deactivate a user — must belong to the same restaurant."""
    client_id = int(current_user["client_id"])
    user = AuthService.get_user_by_id(db, user_id)
    if not user or user.client_id != client_id:
        raise HTTPException(status_code=404, detail="User not found")
    AuthService.deactivate_user(db, user_id)
    return {"message": "User deactivated successfully"}


@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Activate a user — must belong to the same restaurant."""
    client_id = int(current_user["client_id"])
    user = AuthService.get_user_by_id(db, user_id)
    if not user or user.client_id != client_id:
        raise HTTPException(status_code=404, detail="User not found")
    AuthService.activate_user(db, user_id)
    return {"message": "User activated successfully"}
