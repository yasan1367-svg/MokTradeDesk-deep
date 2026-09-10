from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomTimeIntervalCreate(BaseModel):
    name: str
    symbol: str
    start_hour: int
    start_minute: int
    end_hour: int
    end_minute: int
    label: Optional[str] = None
    priority: Optional[int] = None
    description: Optional[str] = None
    is_active: int = 1


class CustomTimeIntervalResponse(BaseModel):
    id: int
    name: str
    symbol: str
    start_hour: int
    start_minute: int
    end_hour: int
    end_minute: int
    label: Optional[str]
    priority: Optional[int]
    description: Optional[str]
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


class TimePointCreate(BaseModel):
    symbol: str
    hour: int
    minute: int
    label: Optional[str] = None
    is_active: int = 1


class TimePointResponse(BaseModel):
    id: int
    symbol: str
    hour: int
    minute: int
    label: Optional[str]
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True