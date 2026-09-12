from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..core.database import get_db
from ..models.strategy import Strategy, StrategyVersion, Trade, StrategyStatus

router = APIRouter()


# ═════════════════════════════════════════════
# Schemas
# ═════════════════════════════════════════════
class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class VersionCreate(BaseModel):
    version_name: str
    rules_note: Optional[str] = None


class VersionUpdate(BaseModel):
    version_name: Optional[str] = None
    rules_note: Optional[str] = None
    status: Optional[str] = None


# ═════════════════════════════════════════════
# Strategies
# ═════════════════════════════════════════════
@router.get("/")
def get_strategies(db: Session = Depends(get_db)):
    strategies = db.query(Strategy).all()
    result = []
    for s in strategies:
        versions = db.query(StrategyVersion).filter(StrategyVersion.strategy_id == s.id).all()
        result.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "created_at": s.created_at,
            "versions_count": len(versions),
        })
    return result


@router.post("/")
def create_strategy(strategy: StrategyCreate, db: Session = Depends(get_db)):
    db_strategy = Strategy(name=strategy.name, description=strategy.description)
    db.add(db_strategy)
    db.commit()
    db.refresh(db_strategy)
    return db_strategy


@router.get("/{strategy_id}")
def get_strategy(strategy_id: int, db: Session = Depends(get_db)):
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="استراتژی پیدا نشد")
    return {
        "id": strategy.id,
        "name": strategy.name,
        "description": strategy.description,
        "created_at": strategy.created_at,
    }


@router.patch("/{strategy_id}")
def update_strategy(strategy_id: int, data: StrategyUpdate, db: Session = Depends(get_db)):
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="استراتژی پیدا نشد")
    if data.name is not None:
        strategy.name = data.name
    if data.description is not None:
        strategy.description = data.description
    db.commit()
    db.refresh(strategy)
    return {"message": "استراتژی به‌روزرسانی شد"}


@router.delete("/{strategy_id}")
def delete_strategy(strategy_id: int, db: Session = Depends(get_db)):
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="استراتژی پیدا نشد")
    db.delete(strategy)
    db.commit()
    return {"message": "استراتژی حذف شد"}


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
        trades_count = db.query(Trade).filter(Trade.version_id == v.id).count()
        result.append({
            "id": v.id,
            "version_name": v.version_name,
            "strategy_id": v.strategy_id,
            "strategy_name": strategy.name if strategy else "نامشخص",
            "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
            "rules_note": v.rules_note,
            "trades_count": trades_count,
            "created_at": v.created_at,
        })
    return result


@router.get("/{strategy_id}/versions")
def get_strategy_versions(strategy_id: int, db: Session = Depends(get_db)):
    """دریافت همه‌ی نسخه‌های یک استراتژی"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="استراتژی پیدا نشد")

    versions = db.query(StrategyVersion).filter(
        StrategyVersion.strategy_id == strategy_id
    ).all()

    result = []
    for v in versions:
        trades_count = db.query(Trade).filter(Trade.version_id == v.id).count()
        result.append({
            "id": v.id,
            "version_name": v.version_name,
            "strategy_id": v.strategy_id,
            "rules_note": v.rules_note,
            "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
            "trades_count": trades_count,
            "created_at": v.created_at,
        })
    return result


@router.post("/{strategy_id}/versions")
def create_version(strategy_id: int, version: VersionCreate, db: Session = Depends(get_db)):
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="استراتژی پیدا نشد")

    db_version = StrategyVersion(
        strategy_id=strategy_id,
        version_name=version.version_name,
        rules_note=version.rules_note,
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


@router.patch("/versions/{version_id}")
def update_version(version_id: int, data: VersionUpdate, db: Session = Depends(get_db)):
    version = db.query(StrategyVersion).filter(StrategyVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="نسخه پیدا نشد")

    if data.version_name is not None:
        version.version_name = data.version_name
    if data.rules_note is not None:
        version.rules_note = data.rules_note
    if data.status is not None:
        try:
            version.status = StrategyStatus(data.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="وضعیت نامعتبر")

    db.commit()
    db.refresh(version)
    return {"message": "نسخه به‌روزرسانی شد"}


@router.delete("/versions/{version_id}")
def delete_version(version_id: int, db: Session = Depends(get_db)):
    version = db.query(StrategyVersion).filter(StrategyVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="نسخه پیدا نشد")

    trades_count = db.query(Trade).filter(Trade.version_id == version_id).count()
    if trades_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"این نسخه {trades_count} معامله دارد و قابل حذف نیست"
        )

    db.delete(version)
    db.commit()
    return {"message": "نسخه حذف شد"}


# ═════════════════════════════════════════════
# Trades of a version
# ═════════════════════════════════════════════
@router.get("/versions/{version_id}/trades")
def get_version_trades(version_id: int, db: Session = Depends(get_db)):
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