from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.strategy import Strategy, StrategyVersion, Trade
from ..schemas.strategy import (
    StrategyCreate, StrategyResponse,
    VersionCreate, VersionResponse
)

router = APIRouter()


# ═════════════════════════════════════════════
# Strategies
# ═════════════════════════════════════════════
@router.post("/", response_model=StrategyResponse)
def create_strategy(strategy: StrategyCreate, db: Session = Depends(get_db)):
    db_strategy = Strategy(name=strategy.name, description=strategy.description)
    db.add(db_strategy)
    db.commit()
    db.refresh(db_strategy)
    return db_strategy


@router.get("/", response_model=List[StrategyResponse])
def get_strategies(db: Session = Depends(get_db)):
    return db.query(Strategy).all()


# ═════════════════════════════════════════════
# Versions
# ═════════════════════════════════════════════
@router.get("/versions/all")
def get_all_versions(db: Session = Depends(get_db)):
    """دریافت لیست همه‌ی نسخه‌ها با نام استراتژی"""
    versions = db.query(StrategyVersion).all()
    result = []
    for v in versions:
        strategy = db.query(Strategy).filter(Strategy.id == v.strategy_id).first()
        result.append({
            "id": v.id,
            "version_name": v.version_name,
            "strategy_id": v.strategy_id,
            "strategy_name": strategy.name if strategy else "نامشخص",
            "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
            "created_at": v.created_at,
        })
    return result


@router.post("/{strategy_id}/versions", response_model=VersionResponse)
def create_version(strategy_id: int, version: VersionCreate, db: Session = Depends(get_db)):
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db_version = StrategyVersion(
        strategy_id=strategy_id,
        version_name=version.version_name,
        rules_note=version.rules_note
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


# ═════════════════════════════════════════════
# Trades (مشاهده‌ی معاملات یک نسخه)
# ═════════════════════════════════════════════
@router.get("/versions/{version_id}/trades")
def get_version_trades(version_id: int, db: Session = Depends(get_db)):
    """دریافت معاملات یک نسخه"""
    trades = db.query(Trade).filter(Trade.version_id == version_id).all()
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "test_type": t.test_type.value if t.test_type else None,
            "source": t.source.value if t.source else None,
            "direction": t.direction,
            "open_time": t.open_time,
            "close_time": t.close_time,
            "open_price": t.open_price,
            "close_price": t.close_price,
            "size": t.size,
            "pnl": t.pnl,
            "commission": t.commission,
            "swap": t.swap,
        }
        for t in trades
    ]