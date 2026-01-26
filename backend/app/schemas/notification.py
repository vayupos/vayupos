from pydantic import BaseModel
from typing import Optional


class NotificationBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_read: Optional[bool] = None


class Notification(NotificationBase):
    id: int
    is_read: bool

    class Config:
        from_attributes = True
