from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..services.analysis_service import AnalysisService
from ..models.strategy import AnalysisResult, CustomTimeInterval
from ..schemas.analytics import (
    CustomTimeIntervalCreate,
    CustomTimeIntervalResponse,
    VersionComparisonRequest,
    VersionComparisonResponse,
)

router = APIRouter()


# ═════════════════════════════════════════════
# تحلیل
# ═════════════════════════════════════════════
@router.post("/analyze/{version_id}")
def analyze_version(version_id: int, db: Session = Depends(get_db)):
    """تحلیل کامل یک نسخه و ذخیره‌ی نتیجه"""
    try:
        service = AnalysisService(db)
        result = service.analyze_version(version_id)
        return {
            "message": "تحلیل با موفقیت انجام شد",
            "analysis_id": result.id,
            "version_id": result.version_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در تحلیل: {str(e)}")


@router.get("/{version_id}")
def get_analysis(version_id: int, db: Session = Depends(get_db)):
    """دریافت تحلیل ذخیره‌شده‌ی یک نسخه"""
    result = db.query(AnalysisResult).filter(
        AnalysisResult.version_id == version_id
    ).first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="تحلیلی برای این نسخه یافت نشد. ابتدا POST /analyze/{version_id} را اجرا کنید."
        )

    return {
        "version_id": result.version_id,
        "total_trades": result.total_trades,
        "win_rate": result.win_rate,
        "profit_factor": result.profit_factor,
        "net_pnl": result.net_pnl,
        "net_r": result.net_r,
        "max_dd": result.max_dd,
        "expectancy": result.expectancy,
        "expectancy_r": result.expectancy_r,
        "avg_win": result.avg_win,
        "avg_loss": result.avg_loss,
        "largest_win": result.largest_win,
        "largest_loss": result.largest_loss,
        "max_consecutive_losses": result.max_consecutive_losses,
        "consistency_analysis": result.consistency_analysis,
        "session_analysis": result.session_analysis,
        "weekday_analysis": result.weekday_analysis,
        "hour_analysis": result.hour_analysis,
        "custom_time_analysis": result.custom_time_analysis,
        "created_at": result.created_at,
    }


# ═════════════════════════════════════════════
# مقایسه
# ═════════════════════════════════════════════
@router.post("/compare", response_model=VersionComparisonResponse)
def compare_versions(request: VersionComparisonRequest, db: Session = Depends(get_db)):
    """مقایسه‌ی چند نسخه و پیشنهاد بهترین"""
    try:
        service = AnalysisService(db)
        result = service.compare_versions(request.version_ids, min_trades=request.min_trades or 0)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در مقایسه: {str(e)}")


# ═════════════════════════════════════════════
# CustomTimeInterval (بازه‌های سفارشی)
# ═════════════════════════════════════════════
@router.get("/intervals/", response_model=List[CustomTimeIntervalResponse])
def get_intervals(symbol: str = None, db: Session = Depends(get_db)):
    """دریافت لیست بازه‌های سفارشی"""
    query = db.query(CustomTimeInterval)
    if symbol:
        query = query.filter(CustomTimeInterval.symbol == symbol)
    return query.all()


@router.post("/intervals/", response_model=CustomTimeIntervalResponse)
def create_interval(interval: CustomTimeIntervalCreate, db: Session = Depends(get_db)):
    """ایجاد بازه‌ی سفارشی جدید"""
    db_interval = CustomTimeInterval(**interval.model_dump())
    db.add(db_interval)
    db.commit()
    db.refresh(db_interval)
    return db_interval


@router.delete("/intervals/{interval_id}")
def delete_interval(interval_id: int, db: Session = Depends(get_db)):
    """حذف یک بازه‌ی سفارشی"""
    db_interval = db.query(CustomTimeInterval).filter(
        CustomTimeInterval.id == interval_id
    ).first()
    if not db_interval:
        raise HTTPException(status_code=404, detail="بازه یافت نشد")
    db.delete(db_interval)
    db.commit()
    return {"message": "بازه با موفقیت حذف شد"}


# ═════════════════════════════════════════════
# Seed (وارد کردن داده‌های اولیه)
# ═════════════════════════════════════════════
@router.post("/intervals/seed-gold")
def seed_gold_intervals(db: Session = Depends(get_db)):
    """وارد کردن بازه‌های پیش‌فرض طلا"""
    gold_intervals = [
        {"name": "بازه طلا A1", "symbol": "XAUUSD", "start_hour": 1, "start_minute": 0,
         "end_hour": 17, "end_minute": 0, "label": "A", "priority": 1},
        {"name": "بازه طلا C1", "symbol": "XAUUSD", "start_hour": 17, "start_minute": 0,
         "end_hour": 18, "end_minute": 30, "label": "C", "priority": 3},
        {"name": "بازه طلا B1", "symbol": "XAUUSD", "start_hour": 16, "start_minute": 20,
         "end_hour": 16, "end_minute": 30, "label": "B", "priority": 2},
        {"name": "بازه طلا A2", "symbol": "XAUUSD", "start_hour": 15, "start_minute": 50,
         "end_hour": 16, "end_minute": 30, "label": "A", "priority": 1},
        {"name": "بازه طلا B2", "symbol": "XAUUSD", "start_hour": 11, "start_minute": 0,
         "end_hour": 12, "end_minute": 30, "label": "B", "priority": 2},
    ]
    created = []
    for data in gold_intervals:
        existing = db.query(CustomTimeInterval).filter(
            CustomTimeInterval.name == data["name"]
        ).first()
        if not existing:
            db_interval = CustomTimeInterval(**data)
            db.add(db_interval)
            created.append(data["name"])
    db.commit()
    return {"message": f"{len(created)} بازه اضافه شد", "created": created}


@router.post("/intervals/seed-dji")
def seed_dji_intervals(db: Session = Depends(get_db)):
    """وارد کردن بازه‌های پیش‌فرض داوجونز"""
    dji_intervals = [
        {"name": "داو A1", "symbol": "DJIUSD", "start_hour": 1, "start_minute": 0,
         "end_hour": 17, "end_minute": 0, "label": "A", "priority": 1},
        {"name": "داو C1", "symbol": "DJIUSD", "start_hour": 17, "start_minute": 0,
         "end_hour": 18, "end_minute": 30, "label": "C", "priority": 3},
        {"name": "داو B1", "symbol": "DJIUSD", "start_hour": 16, "start_minute": 20,
         "end_hour": 16, "end_minute": 30, "label": "B", "priority": 2},
        {"name": "داو A2", "symbol": "DJIUSD", "start_hour": 15, "start_minute": 50,
         "end_hour": 16, "end_minute": 30, "label": "A", "priority": 1},
        {"name": "داو B2", "symbol": "DJIUSD", "start_hour": 11, "start_minute": 0,
         "end_hour": 12, "end_minute": 30, "label": "B", "priority": 2},
    ]
    created = []
    for data in dji_intervals:
        existing = db.query(CustomTimeInterval).filter(
            CustomTimeInterval.name == data["name"]
        ).first()
        if not existing:
            db_interval = CustomTimeInterval(**data)
            db.add(db_interval)
            created.append(data["name"])
    db.commit()
    return {"message": f"{len(created)} بازه اضافه شد", "created": created}