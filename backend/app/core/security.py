import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional

from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
        
    Raises:
        ValueError: If password exceeds 72 bytes after UTF-8 encoding
    """
    # Bcrypt has a hard limit of 72 bytes
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError(
            f"Password exceeds bcrypt's 72-byte limit ({len(password_bytes)} bytes). "
            "Please use a shorter password."
        )
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password.decode("utf-8")


# Alias for backward compatibility
get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password
        
    Returns:
        bool: True if password matches, False otherwise
    """
    plain_password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")
    
    try:
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time delta
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_EXPIRATION)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time delta
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Refresh tokens last longer - typically 7 days
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token to decode
        
    Returns:
        dict: Decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
