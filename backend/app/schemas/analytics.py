from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────
# CustomTimeInterval
# ─────────────────────────────────────────────
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


# ─────────────────────────────────────────────
# Comparison
# ─────────────────────────────────────────────
class VersionComparisonRequest(BaseModel):
    version_ids: List[int]


class VersionComparisonItem(BaseModel):
    version_id: int
    version_name: str
    strategy_name: str
    total_trades: int
    win_rate: float
    profit_factor: float
    net_pnl: float
    max_dd: float
    score: float


class VersionComparisonResponse(BaseModel):
    items: List[VersionComparisonItem]
    best_version_id: int
    best_version_name: str
    recommendation: str