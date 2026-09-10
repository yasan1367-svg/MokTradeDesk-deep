from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..models.strategy import Trade, TradeSource

class Soft4XImporter:
    """واردکننده فایل‌های اکسل خروجی Soft4X"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def parse_file(self, file_path: str) -> List[Dict[str, Any]]:
        """خواندن فایل اکسل و تبدیل به لیست دیکشنری"""
        from openpyxl import load_workbook
        
        wb = load_workbook(file_path, data_only=True)
        ws = wb["Trades"]
        
        # خواندن هدرها
        headers = []
        for cell in ws[1]:
            headers.append(cell.value)
        
        # پیدا کردن ایندکس ستون‌ها
        col_index = {}
        for idx, header in enumerate(headers):
            if header:
                col_index[str(header).strip()] = idx
        
        trades = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or not row[0]:
                continue
            
            open_time = self._to_datetime(self._get_value(row, col_index.get("Open Time")))
            close_time = self._to_datetime(self._get_value(row, col_index.get("Close Time")))
            
            trade = {
                "symbol": "XAUUSD",
                "direction": self._get_direction(self._get_value(row, col_index.get("Type"))),
                "open_time": open_time,
                "close_time": close_time,
                "open_price": float(self._get_value(row, col_index.get("Open Price"), 0)),
                "close_price": float(self._get_value(row, col_index.get("Close Price"), 0)),
                "size": float(self._get_value(row, col_index.get("Size"), 0)),
                "sl": self._to_float(self._get_value(row, col_index.get("SL"))),
                "tp": self._to_float(self._get_value(row, col_index.get("TP"))),
                "pnl": float(self._get_value(row, col_index.get("P/L"), 0)),
                "r_multiple": None,
                "commission": self._to_float(self._get_value(row, col_index.get("Commission"))) or 0,
                "swap": 0.0,
                "entry_sequence": 1,
                "source": TradeSource.SOFT4X_IMPORT,
                "raw_data": self._make_json_safe({headers[i]: row[i] for i in range(len(row)) if i < len(headers)})
            }
            trades.append(trade)
        
        return trades
    
    def save_trades(self, trades: List[Dict[str, Any]], version_id: int) -> List[Trade]:
        """ذخیره معاملات در دیتابیس"""
        db_trades = []
        for trade_data in trades:
            db_trade = Trade(
                version_id=version_id,
                **trade_data
            )
            self.db.add(db_trade)
            db_trades.append(db_trade)
        
        self.db.commit()
        return db_trades
    
    def _get_value(self, row, index, default=None):
        """دریافت مقدار از ردیف با مدیریت None"""
        if index is None:
            return default
        try:
            value = row[index] if index < len(row) else default
            return value if value is not None else default
        except:
            return default
    
    def _get_direction(self, value):
        """تبدیل جهت معامله"""
        if value:
            return "buy" if str(value).lower() == "buy" else "sell"
        return "sell"
    
    def _to_float(self, value):
        """تبدیل به float با مدیریت None"""
        if value is None:
            return None
        try:
            return float(value)
        except:
            return None
    
    def _to_datetime(self, value):
        """تبدیل به datetime پایتون (نه Timestamp)"""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            if hasattr(value, 'to_pydatetime'):  # اگر pandas Timestamp باشد
                return value.to_pydatetime()
            return datetime.strptime(str(value), "%Y-%m-%d %H:%M:%S")
        except:
            try:
                return datetime.fromisoformat(str(value))
            except:
                return None
    
    def _make_json_safe(self, data: dict) -> dict:
        """تبدیل مقادیر غیرقابل JSON به فرمت قابل ذخیره"""
        safe_data = {}
        for key, value in data.items():
            if value is None:
                safe_data[key] = None
            elif isinstance(value, datetime):
                safe_data[key] = value.isoformat()
            elif hasattr(value, 'to_pydatetime'):  # pandas Timestamp
                safe_data[key] = value.to_pydatetime().isoformat()
            elif hasattr(value, 'isoformat'):
                safe_data[key] = value.isoformat()
            elif isinstance(value, (int, float, str, bool)):
                safe_data[key] = value
            else:
                safe_data[key] = str(value)
        return safe_data