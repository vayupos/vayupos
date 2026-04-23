"""Tests for authentication"""
from tests.conftest import client
import pytest


def test_register():
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test@1234",
            "full_name": "Test User",
            "phone_number": "1234567890",
        },
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_login():
    """Test user login"""
    # First register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "logintest",
            "email": "login@example.com",
            "password": "Login@1234",
            "full_name": "Login Test",
        },
    )

    # Then login
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": "logintest", "password": "Login@1234"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_invalid_login():
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": "nonexistent", "password": "wrongpassword"},
    )
    assert response.status_code == 401
