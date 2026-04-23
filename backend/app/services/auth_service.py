"""Authentication and User service"""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models import User, PasswordResetToken
from app.schemas import UserCreate, UserUpdate
from app.core.security import (
    verify_password,
    hash_password,
    hash_reset_token,
    generate_password_reset_token,
)
from app.core.exceptions import (
    not_found_exception,
    bad_request_exception,
    conflict_exception,
)
from app.utils.auth_email import send_password_reset_email_mock


class AuthService:
    """Service for authentication operations"""

    @staticmethod
    def _generate_new_client_id(db: Session) -> int:
        """Generate a new tenant/client id for self-serve signup."""
        max_client_id = db.query(func.max(User.client_id)).scalar()
        return (max_client_id or 0) + 1

    @staticmethod
    def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
        """Authenticate a user by username/email/phone and password."""
        normalized_identifier = identifier.strip().lower()
        user = db.query(User).filter(
            or_(
                func.lower(User.username) == normalized_identifier,
                func.lower(User.email) == normalized_identifier,
                User.phone_number == identifier.strip(),
            )
        ).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_user(db: Session, user_create: UserCreate, create_new_client: bool = False) -> User:
        """Create a new user"""
        normalized_username = user_create.username.strip().lower()
        normalized_email = str(user_create.email).strip().lower()
        normalized_phone = user_create.phone_number.strip() if user_create.phone_number else None

        existing_username = db.query(User).filter(func.lower(User.username) == normalized_username).first()
        if existing_username:
            raise conflict_exception("Username already exists, try another")

        existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_email:
            raise conflict_exception("Email already registered")

        if normalized_phone:
            existing_phone = db.query(User).filter(User.phone_number == normalized_phone).first()
            if existing_phone:
                raise conflict_exception("Phone number already registered")

        # Hash password
        hashed_password = hash_password(user_create.password)

        client_id = (
            AuthService._generate_new_client_id(db)
            if create_new_client
            else user_create.client_id
        )

        # Create user
        db_user = User(
            client_id=client_id,
            username=normalized_username,
            email=normalized_email,
            hashed_password=hashed_password,
            full_name=user_create.full_name,
            phone_number=normalized_phone,
            role=user_create.role,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(func.lower(User.username) == username.strip().lower()).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
        """Update user information"""
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise not_found_exception("User not found")

        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> User:
        """Change user password"""
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise not_found_exception("User not found")

        # Verify old password
        if not verify_password(old_password, user.hashed_password):
            raise bad_request_exception("Old password is incorrect")

        # Hash and set new password
        user.hashed_password = hash_password(new_password)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def create_password_reset_token(
        db: Session, email: str, reset_link_base: str = "https://yourfrontend.com/reset-password"
    ) -> None:
        """Create and send password reset token when email exists."""
        user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
        if not user:
            return

        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        ).update({PasswordResetToken.used: True}, synchronize_session=False)

        raw_token = generate_password_reset_token()
        token_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
        db.add(token_record)
        db.commit()

        reset_link = f"{reset_link_base}?token={raw_token}"
        send_password_reset_email_mock(email=user.email, reset_link=reset_link)

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> None:
        """Reset user password using a valid unexpired reset token."""
        token_hash = hash_reset_token(token)
        token_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False),
        ).first()

        if not token_record or token_record.expires_at < datetime.utcnow():
            raise bad_request_exception("Invalid or expired reset token")

        user = db.query(User).filter(User.id == token_record.user_id).first()
        if not user:
            raise not_found_exception("User not found")

        user.hashed_password = hash_password(new_password)
        token_record.used = True
        db.commit()

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[User], int]:
        """List all users with pagination"""
        query = db.query(User)
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return users, total

    @staticmethod
    def deactivate_user(db: Session, user_id: int) -> User:
        """Deactivate a user account"""
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise not_found_exception("User not found")

        user.is_active = False
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def activate_user(db: Session, user_id: int) -> User:
        """Activate a user account"""
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise not_found_exception("User not found")

        user.is_active = True
        db.commit()
        db.refresh(user)
        return user
