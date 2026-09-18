"""
توابع کمکی مشترک برای محاسبات معامله (R-Multiple و ...)
این‌ها هم توی ایمپورترها (Soft4X, MT4) و هم توی ثبت دستی معامله استفاده می‌شن
تا فرمول محاسبه همه‌جا یکسان باشه.
"""
from typing import Optional


def calculate_r_multiple(
    direction: str,
    open_price: Optional[float],
    close_price: Optional[float],
    sl: Optional[float],
) -> Optional[float]:
    """
    محاسبه‌ی R-Multiple بر پایه‌ی فاصله‌ی قیمتی (مستقل از حجم و نوع نماد).

    R = فاصله‌ی سود/زیان / فاصله‌ی ریسک (استاپ‌لاس)

    - اگه استاپ‌لاس ثبت نشده باشه، R قابل‌محاسبه نیست → None برمی‌گرده
      (این عمداً silent-zero نمی‌کنه، چون معامله‌ی بدون SL با R=0 اشتباه گرفته می‌شه)
    - اگه استاپ‌لاس در جهت اشتباه ثبت شده باشه (فاصله‌ی ریسک <= 0)، همینطور None
    """
    if sl is None or open_price is None or close_price is None:
        return None

    direction = (direction or "").lower()

    if direction == "buy":
        risk_distance = open_price - sl
        move_distance = close_price - open_price
    elif direction == "sell":
        risk_distance = sl - open_price
        move_distance = open_price - close_price
    else:
        return None

    if risk_distance <= 0:
        return None

    return round(move_distance / risk_distance, 3)
