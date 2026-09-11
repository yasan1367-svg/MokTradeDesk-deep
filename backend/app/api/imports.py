from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import tempfile
import os
from typing import Optional

from ..core.database import get_db
from ..services.import_service import Soft4XImporter, MT4Importer
from ..models.strategy import StrategyVersion

router = APIRouter()


# ═════════════════════════════════════════════
# Soft4X Import
# ═════════════════════════════════════════════
@router.post("/soft4x")
async def import_soft4x(
    file: UploadFile = File(...),
    version_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """واردات فایل اکسل Soft4X"""
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
            "preview": trades[:3]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در پردازش فایل: {str(e)}")

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ═════════════════════════════════════════════
# MT4 Import (HTML)
# ═════════════════════════════════════════════
@router.post("/mt4")
async def import_mt4(
    file: UploadFile = File(...),
    version_id: Optional[int] = Form(None),
    prop_stage_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """واردات فایل HTML متاتریدر (بخش Positions)"""
    if not file.filename.endswith('.html'):
        raise HTTPException(status_code=400, detail="فایل باید با فرمت html باشد")

    content = await file.read()
    print(f"📁 حجم فایل: {len(content)} بایت")
    print(f"📁 نام فایل: {file.filename}")

    # تلاش برای decode با encodingهای مختلف
    html_content = None
    for encoding in ['utf-8', 'utf-16', 'windows-1256', 'iso-8859-1', 'cp1252']:
        try:
            html_content = content.decode(encoding)
            print(f"✅ فایل با encoding {encoding} خوانده شد")
            break
        except (UnicodeDecodeError, LookupError):
            continue

    if html_content is None:
        raise HTTPException(status_code=400, detail="نمی‌توان فایل را خواند (encoding نامشخص)")

    print(f"📄 ۲۰۰ کاراکتر اول: {html_content[:200]}")

    try:
        importer = MT4Importer(db)
        trades = importer.parse_html(html_content)

        if not trades:
            raise HTTPException(status_code=400, detail="هیچ معامله‌ای در فایل یافت نشد")

        if version_id:
            version = db.query(StrategyVersion).filter(StrategyVersion.id == version_id).first()
            if not version:
                raise HTTPException(status_code=404, detail="نسخه استراتژی پیدا نشد")
            saved = importer.save_trades(trades, version_id=version_id)
            message = f"{len(saved)} معامله با موفقیت وارد شد"
        elif prop_stage_id:
            saved = importer.save_trades(trades, prop_stage_id=prop_stage_id)
            message = f"{len(saved)} معامله با موفقیت وارد شد (پراپ)"
        else:
            saved = []
            message = f"{len(trades)} معامله شناسایی شد. برای ذخیره، version_id یا prop_stage_id را وارد کنید."

        return {
            "message": message,
            "total_trades": len(trades),
            "saved_trades": len(saved),
            "preview": trades[:3]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در پردازش فایل: {str(e)}")