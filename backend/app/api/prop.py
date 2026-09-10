from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.prop import PropFirm
from ..schemas.prop import PropFirmCreate, PropFirmResponse

router = APIRouter()

@router.get("/firms", response_model=List[PropFirmResponse])
def get_firms(db: Session = Depends(get_db)):
    return db.query(PropFirm).all()

@router.post("/firms", response_model=PropFirmResponse)
def create_firm(firm: PropFirmCreate, db: Session = Depends(get_db)):
    db_firm = PropFirm(**firm.dict())
    db.add(db_firm)
    db.commit()
    db.refresh(db_firm)
    return db_firm