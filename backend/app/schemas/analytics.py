from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ═════════════════════════════════════════════
# CustomTimeInterval
# ═════════════════════════════════════════════
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


# ═════════════════════════════════════════════
# TimePoint
# ═════════════════════════════════════════════
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


# ═════════════════════════════════════════════
# Comparison
# ═════════════════════════════════════════════
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
    symbols: List[str] = []
    session_analysis: Optional[dict] = None
    weekday_analysis: Optional[dict] = None
    hour_analysis: Optional[dict] = None
    custom_time_analysis: Optional[dict] = None


class ReasonItem(BaseModel):
    icon: str
    text: str


class SymbolBest(BaseModel):
    symbol: str
    symbol_label: str
    best_version_id: int
    best_version_name: str
    best_strategy: str
    win_rate: float
    net_pnl: float
    score: float


class DetailBest(BaseModel):
    name: str
    best: dict


class DetailBests(BaseModel):
    session: List[DetailBest] = []
    weekday: List[DetailBest] = []
    hour: List[DetailBest] = []
    custom_interval: List[DetailBest] = []


class VersionComparisonResponse(BaseModel):
    items: List[VersionComparisonItem]
    best_version_id: int
    best_version_name: str
    best_score: float
    recommendation: str
    reasons: List[ReasonItem] = []
    symbol_bests: List[SymbolBest] = []
    detail_bests: Optional[DetailBests] = None