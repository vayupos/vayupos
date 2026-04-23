"""Authentication email helpers (mock implementation)."""


def send_password_reset_email_mock(email: str, reset_link: str) -> bool:
    """
    Mock password reset sender.
    Replace with actual provider integration in production.
    """
    print(f"[MOCK EMAIL] Password reset for {email}: {reset_link}")
    return True
