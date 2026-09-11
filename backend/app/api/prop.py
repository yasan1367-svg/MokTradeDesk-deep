from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..core.database import get_db
from ..models.prop import (
    PropFirm, PropAccount, PropStage, PropWithdrawal, PropCost,
    StageType, StageStatus, FailureReason
)

router = APIRouter()


# ═════════════════════════════════════════════
# Schemas
# ═════════════════════════════════════════════
class PropFirmCreate(BaseModel):
    name: str
    default_profit_share: Optional[float] = 80.0
    website: Optional[str] = None
    notes: Optional[str] = None


class PropAccountCreate(BaseModel):
    prop_firm_id: int
    account_label: str
    account_number: Optional[str] = None
    currency: str = "USD"
    # مقادیر دلاری
    initial_balance: Optional[float] = 10000.0
    profit_target: Optional[float] = 800.0
    max_daily_dd: Optional[float] = 500.0
    max_total_dd: Optional[float] = 1000.0
    min_trading_days: Optional[int] = 5


class PropStageCreate(BaseModel):
    prop_account_id: int
    stage_type: str
    profit_target: Optional[float] = None
    max_daily_dd: Optional[float] = None
    max_total_dd: Optional[float] = None
    min_trading_days: Optional[int] = None
    initial_balance: Optional[float] = None
    profit_share_percentage: Optional[float] = None


class PassStageRequest(BaseModel):
    final_balance: Optional[float] = None


class FailStageRequest(BaseModel):
    failure_reason: str
    failure_details: Optional[str] = None


class WithdrawalCreate(BaseModel):
    amount: float
    note: Optional[str] = None


class PropCostCreate(BaseModel):
    prop_account_id: int
    cost_type: str
    amount: float
    currency: str = "USD"
    description: Optional[str] = None


# ═════════════════════════════════════════════
# Prop Firm
# ═════════════════════════════════════════════
@router.get("/firms")
def get_firms(db: Session = Depends(get_db)):
    firms = db.query(PropFirm).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "default_profit_share": f.default_profit_share,
            "website": f.website,
            "notes": f.notes,
            "created_at": f.created_at,
        }
        for f in firms
    ]


@router.post("/firms")
def create_firm(firm: PropFirmCreate, db: Session = Depends(get_db)):
    db_firm = PropFirm(**firm.model_dump())
    db.add(db_firm)
    db.commit()
    db.refresh(db_firm)
    return db_firm


# ═════════════════════════════════════════════
# Prop Account
# ═════════════════════════════════════════════
@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(PropAccount).all()
    result = []
    for a in accounts:
        firm = db.query(PropFirm).filter(PropFirm.id == a.prop_firm_id).first()
        stages = db.query(PropStage).filter(PropStage.prop_account_id == a.id).all()
        result.append({
            "id": a.id,
            "account_label": a.account_label,
            "account_number": a.account_number,
            "currency": a.currency,
            "is_active": a.is_active,
            "firm_name": firm.name if firm else "نامشخص",
            "stages_count": len(stages),
            "created_at": a.created_at,
        })
    return result


@router.post("/accounts")
def create_account(account: PropAccountCreate, db: Session = Depends(get_db)):
    firm = db.query(PropFirm).filter(PropFirm.id == account.prop_firm_id).first()
    if not firm:
        raise HTTPException(status_code=404, detail="شرکت پراپ پیدا نشد")

    # ایجاد اکانت
    db_account = PropAccount(
        prop_firm_id=account.prop_firm_id,
        account_label=account.account_label,
        account_number=account.account_number,
        currency=account.currency,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)

    # ایجاد خودکار Stage 1 با قوانین دلاری
    stage1 = PropStage(
        prop_account_id=db_account.id,
        stage_type=StageType.STAGE_1,
        status=StageStatus.ACTIVE,
        start_date=datetime.utcnow(),
        initial_balance=account.initial_balance,
        profit_target=account.profit_target,
        max_daily_dd=account.max_daily_dd,
        max_total_dd=account.max_total_dd,
        min_trading_days=account.min_trading_days,
    )
    db.add(stage1)
    db.commit()

    return {"id": db_account.id, "message": "اکانت و مرحله ۱ ایجاد شد"}

@router.get("/stages/{stage_id}/trades")
def get_stage_trades(stage_id: int, db: Session = Depends(get_db)):
    """دریافت معاملات یک مرحله"""
    from ..models.strategy import Trade
    trades = db.query(Trade).filter(Trade.prop_stage_id == stage_id).all()
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
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

@router.get("/accounts/{account_id}")
def get_account_detail(account_id: int, db: Session = Depends(get_db)):
    account = db.query(PropAccount).filter(PropAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="اکانت پیدا نشد")

    firm = db.query(PropFirm).filter(PropFirm.id == account.prop_firm_id).first()
    stages = db.query(PropStage).filter(PropStage.prop_account_id == account_id).all()

    return {
        "id": account.id,
        "account_label": account.account_label,
        "account_number": account.account_number,
        "currency": account.currency,
        "firm_name": firm.name if firm else "نامشخص",
        "stages": [
            {
                "id": s.id,
                "stage_type": s.stage_type.value if s.stage_type else None,
                "status": s.status.value if s.status else None,
                "start_date": s.start_date,
                "end_date": s.end_date,
                "profit_target": s.profit_target,
                "max_daily_dd": s.max_daily_dd,
                "max_total_dd": s.max_total_dd,
                "initial_balance": s.initial_balance,
                "final_balance": s.final_balance,
                "current_profit": s.current_profit,
                "total_withdrawn": s.total_withdrawn,
                "profit_share_percentage": s.profit_share_percentage,
                "failure_reason": s.failure_reason.value if s.failure_reason else None,
                "failure_details": s.failure_details,
            }
            for s in stages
        ],
    }


# ═════════════════════════════════════════════
# Prop Stage
# ═════════════════════════════════════════════
@router.post("/stages/{stage_id}/pass")
def pass_stage(stage_id: int, request: PassStageRequest, db: Session = Depends(get_db)):
    stage = db.query(PropStage).filter(PropStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="مرحله پیدا نشد")

    stage.status = StageStatus.PASSED
    stage.end_date = datetime.utcnow()
    if request.final_balance:
        stage.final_balance = request.final_balance
    db.commit()

    # ایجاد خودکار مرحله‌ی بعدی
    if stage.stage_type == StageType.STAGE_1:
        next_stage = PropStage(
            prop_account_id=stage.prop_account_id,
            stage_type=StageType.STAGE_2,
            status=StageStatus.ACTIVE,
            start_date=datetime.utcnow(),
            initial_balance=stage.final_balance or stage.initial_balance,
        )
        db.add(next_stage)
        db.commit()
        return {"message": "مرحله ۱ پاس شد. مرحله ۲ ایجاد شد."}

    elif stage.stage_type == StageType.STAGE_2:
        next_stage = PropStage(
            prop_account_id=stage.prop_account_id,
            stage_type=StageType.FUNDED_REAL,
            status=StageStatus.ACTIVE,
            start_date=datetime.utcnow(),
            initial_balance=stage.final_balance or stage.initial_balance,
            profit_share_percentage=80.0,
        )
        db.add(next_stage)
        db.commit()
        return {"message": "مرحله ۲ پاس شد. مرحله رییل ایجاد شد."}

    return {"message": "مرحله پاس شد"}


@router.post("/stages/{stage_id}/fail")
def fail_stage(stage_id: int, request: FailStageRequest, db: Session = Depends(get_db)):
    stage = db.query(PropStage).filter(PropStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="مرحله پیدا نشد")

    stage.status = StageStatus.FAILED
    stage.end_date = datetime.utcnow()
    stage.failure_reason = FailureReason(request.failure_reason)
    stage.failure_details = request.failure_details
    db.commit()

    return {"message": "مرحله فیل شد"}


# ═════════════════════════════════════════════
# Withdrawal
# ═════════════════════════════════════════════
@router.post("/stages/{stage_id}/withdraw")
def withdraw(stage_id: int, request: WithdrawalCreate, db: Session = Depends(get_db)):
    stage = db.query(PropStage).filter(PropStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="مرحله پیدا نشد")

    if stage.stage_type != StageType.FUNDED_REAL:
        raise HTTPException(status_code=400, detail="برداشت فقط در مرحله رییل مجاز است")

    withdrawal = PropWithdrawal(
        prop_stage_id=stage_id,
        amount=request.amount,
        note=request.note,
    )
    db.add(withdrawal)

    stage.total_withdrawn = (stage.total_withdrawn or 0) + request.amount
    stage.current_profit = (stage.current_profit or 0) - request.amount
    db.commit()

    return {"message": f"{request.amount} دلار برداشت ثبت شد"}


@router.get("/stages/{stage_id}/withdrawals")
def get_withdrawals(stage_id: int, db: Session = Depends(get_db)):
    withdrawals = db.query(PropWithdrawal).filter(
        PropWithdrawal.prop_stage_id == stage_id
    ).all()
    return [
        {
            "id": w.id,
            "amount": w.amount,
            "withdrawal_date": w.withdrawal_date,
            "note": w.note,
        }
        for w in withdrawals
    ]


# ═════════════════════════════════════════════
# Prop Cost
# ═════════════════════════════════════════════
@router.post("/costs")
def create_cost(cost: PropCostCreate, db: Session = Depends(get_db)):
    db_cost = PropCost(**cost.model_dump())
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    return db_cost


@router.get("/accounts/{account_id}/costs")
def get_costs(account_id: int, db: Session = Depends(get_db)):
    costs = db.query(PropCost).filter(PropCost.prop_account_id == account_id).all()
    return costs