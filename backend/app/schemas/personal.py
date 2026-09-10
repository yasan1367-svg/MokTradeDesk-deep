from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PersonalAccountCreate(BaseModel):
    name: str
    broker_name: str
    account_number: Optional[str] = None
    currency: str = "USD"
    initial_balance: float = 0.0

class PersonalAccountResponse(BaseModel):
    id: int
    name: str
    broker_name: str
    account_number: Optional[str]
    currency: str
    initial_balance: float
    current_balance: float
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True