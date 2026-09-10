from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import tempfile
import os

from ..core.database import get_db
from ..services.import_service import Soft4XImporter
from ..models.strategy import StrategyVersion

router = APIRouter()

@router.post("/soft4x")
async def import_soft4x(
    file: UploadFile = File(...),
    version_id: int = None,
    db: Session = Depends(get_db)
):
    """
    واردات فایل اکسل Soft4X
    
    - **file**: فایل اکسل (xlsx)
    - **version_id**: شناسه نسخه استراتژی (اختیاری)
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="فایل باید با فرمت xlsx باشد")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        importer = Soft4XImporter(db)
        trades = importer.parse_file(tmp_path)
        
        if version_id:
            version = db.query(StrategyVersion).filter(StrategyVersion.id == version_id).first()
            if not version:
                raise HTTPException(status_code=404, detail="نسخه استراتژی پیدا نشد")
            saved_trades = importer.save_trades(trades, version_id)
            message = f"{len(saved_trades)} معامله با موفقیت وارد شد"
        else:
            saved_trades = []
            message = f"{len(trades)} معامله شناسایی شد. برای ذخیره، version_id را وارد کنید."
        
        return {
            "message": message,
            "total_trades": len(trades),
            "saved_trades": len(saved_trades),
            "preview": trades[:5]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در پردازش فایل: {str(e)}")
    
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)