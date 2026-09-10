from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None

class StrategyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class VersionCreate(BaseModel):
    version_name: str
    rules_note: Optional[str] = None

class VersionResponse(BaseModel):
    id: int
    strategy_id: int
    version_name: str
    rules_note: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True