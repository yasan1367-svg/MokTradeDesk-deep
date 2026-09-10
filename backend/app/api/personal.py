from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.personal import PersonalAccount
from ..schemas.personal import PersonalAccountCreate, PersonalAccountResponse

router = APIRouter()

@router.get("/accounts", response_model=List[PersonalAccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    return db.query(PersonalAccount).all()

@router.post("/accounts", response_model=PersonalAccountResponse)
def create_account(account: PersonalAccountCreate, db: Session = Depends(get_db)):
    db_account = PersonalAccount(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account