from sqlalchemy.orm import Session
from typing import Dict, List, Any

from ..models.strategy import (
    Trade, AnalysisResult, CustomTimeInterval,
    StrategyVersion, Strategy
)


class AnalysisService:
    """سرویس تحلیل معاملات یک نسخه استراتژی"""

    def __init__(self, db: Session):
        self.db = db

    # ═════════════════════════════════════════════
    # تحلیل یک نسخه
    # ═════════════════════════════════════════════
    def analyze_version(self, version_id: int) -> AnalysisResult:
        """تحلیل کامل یک نسخه و ذخیره‌ی نتیجه"""
        trades = self.db.query(Trade).filter(Trade.version_id == version_id).all()
        if not trades:
            raise ValueError("هیچ معامله‌ای برای این نسخه یافت نشد")

        basic_metrics = self._calculate_basic_metrics(trades)
        session_analysis = self._analyze_by_session(trades)
        weekday_analysis = self._analyze_by_weekday(trades)
        hour_analysis = self._analyze_by_hour(trades)
        custom_time_analysis = self._analyze_by_custom_intervals(trades)

        existing = self.db.query(AnalysisResult).filter(
            AnalysisResult.version_id == version_id
        ).first()
        if existing:
            self.db.delete(existing)
            self.db.commit()

        result = AnalysisResult(
            version_id=version_id,
            total_trades=basic_metrics["total_trades"],
            win_rate=basic_metrics["win_rate"],
            profit_factor=basic_metrics["profit_factor"],
            net_pnl=basic_metrics["net_pnl"],
            net_r=basic_metrics["net_r"],
            max_dd=basic_metrics["max_dd"],
            session_analysis=session_analysis,
            weekday_analysis=weekday_analysis,
            hour_analysis=hour_analysis,
            custom_time_analysis=custom_time_analysis,
        )
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)

        return result

    # ═════════════════════════════════════════════
    # مقایسه‌ی چند نسخه
    # ═════════════════════════════════════════════
    def compare_versions(self, version_ids: List[int]) -> Dict[str, Any]:
        """مقایسه‌ی چند نسخه و پیشنهاد بهترین"""
        items = []
        for vid in version_ids:
            version = self.db.query(StrategyVersion).filter(
                StrategyVersion.id == vid
            ).first()
            if not version:
                continue

            analysis = self.db.query(AnalysisResult).filter(
                AnalysisResult.version_id == vid
            ).first()
            if not analysis:
                continue

            strategy = self.db.query(Strategy).filter(
                Strategy.id == version.strategy_id
            ).first()

            score = self._calculate_score(analysis)

            items.append({
                "version_id": vid,
                "version_name": version.version_name,
                "strategy_name": strategy.name if strategy else "نامشخص",
                "total_trades": analysis.total_trades,
                "win_rate": analysis.win_rate,
                "profit_factor": analysis.profit_factor,
                "net_pnl": analysis.net_pnl,
                "max_dd": analysis.max_dd,
                "score": round(score, 2),
            })

        if not items:
            raise ValueError("هیچ تحلیلی برای نسخه‌های انتخاب‌شده یافت نشد")

        items.sort(key=lambda x: x["score"], reverse=True)
        best = items[0]

        recommendation = (
            f"بر اساس ترکیب نرخ برد، فاکتور سود و حداقل افت سرمایه، "
            f"نسخه‌ی «{best['version_name']}» از استراتژی «{best['strategy_name']}» "
            f"با امتیاز {best['score']} بهترین عملکرد را داشته است."
        )

        return {
            "items": items,
            "best_version_id": best["version_id"],
            "best_version_name": best["version_name"],
            "recommendation": recommendation,
        }

    def _calculate_score(self, analysis: AnalysisResult) -> float:
        """محاسبه‌ی امتیاز ترکیبی برای رتبه‌بندی"""
        win_rate_score = min(analysis.win_rate, 100)
        profit_factor_score = min(analysis.profit_factor * 20, 100)
        net_pnl_score = min(max(analysis.net_pnl, 0) / 10, 100)
        dd_penalty = min(analysis.max_dd / 10, 50)

        score = (
            win_rate_score * 0.35 +
            profit_factor_score * 0.35 +
            net_pnl_score * 0.30 -
            dd_penalty * 0.20
        )

        return max(score, 0)

    # ═════════════════════════════════════════════
    # متریک‌های پایه
    # ═════════════════════════════════════════════
    def _calculate_basic_metrics(self, trades: List[Trade]) -> Dict[str, Any]:
        total = len(trades)
        wins = [t for t in trades if t.pnl and t.pnl > 0]
        losses = [t for t in trades if t.pnl and t.pnl < 0]

        gross_profit = sum(t.pnl for t in wins) if wins else 0
        gross_loss = abs(sum(t.pnl for t in losses)) if losses else 0

        net_pnl = sum(t.pnl for t in trades if t.pnl) or 0
        win_rate = (len(wins) / total * 100) if total > 0 else 0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0

        r_multiples = [t.r_multiple for t in trades if t.r_multiple is not None]
        net_r = sum(r_multiples) if r_multiples else 0

        max_dd = self._calculate_max_drawdown(trades)

        return {
            "total_trades": total,
            "win_rate": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "net_pnl": round(net_pnl, 2),
            "net_r": round(net_r, 2),
            "max_dd": round(max_dd, 2),
        }

    def _calculate_max_drawdown(self, trades: List[Trade]) -> float:
        """محاسبه‌ی حداکثر افت سرمایه"""
        sorted_trades = sorted(trades, key=lambda t: t.close_time or t.open_time)
        equity = 0
        peak = 0
        max_dd = 0

        for t in sorted_trades:
            equity += t.pnl or 0
            if equity > peak:
                peak = equity
            dd = peak - equity
            if dd > max_dd:
                max_dd = dd

        return max_dd

    # ═════════════════════════════════════════════
    # تحلیل‌های تفکیکی
    # ═════════════════════════════════════════════
    def _analyze_by_session(self, trades: List[Trade]) -> Dict[str, Any]:
        """تحلیل بر اساس سشن (آسیا، اروپا، آمریکا)"""
        sessions = {"Asia": [], "Europe": [], "America": [], "Other": []}

        for t in trades:
            if not t.close_time:
                continue
            hour = t.close_time.hour
            if 0 <= hour < 8:
                sessions["Asia"].append(t)
            elif 8 <= hour < 16:
                sessions["Europe"].append(t)
            elif 16 <= hour < 24:
                sessions["America"].append(t)
            else:
                sessions["Other"].append(t)

        return {name: self._summarize(trades) for name, trades in sessions.items() if trades}

    def _analyze_by_weekday(self, trades: List[Trade]) -> Dict[str, Any]:
        """تحلیل بر اساس روز هفته"""
        weekdays = {
            0: "Monday", 1: "Tuesday", 2: "Wednesday",
            3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"
        }
        by_day = {day: [] for day in weekdays.values()}

        for t in trades:
            if not t.close_time:
                continue
            day_name = weekdays[t.close_time.weekday()]
            by_day[day_name].append(t)

        return {name: self._summarize(trades) for name, trades in by_day.items() if trades}

    def _analyze_by_hour(self, trades: List[Trade]) -> Dict[str, Any]:
        """تحلیل بر اساس ساعت (۰ تا ۲۳)"""
        by_hour = {str(h): [] for h in range(24)}

        for t in trades:
            if not t.close_time:
                continue
            hour = str(t.close_time.hour)
            by_hour[hour].append(t)

        return {h: self._summarize(trades) for h, trades in by_hour.items() if trades}

    def _analyze_by_custom_intervals(self, trades: List[Trade]) -> Dict[str, Any]:
        """تحلیل بر اساس بازه‌های سفارشی (با فیلتر symbol)"""
        intervals = self.db.query(CustomTimeInterval).filter(
            CustomTimeInterval.is_active == 1
        ).all()

        result = {}
        for interval in intervals:
            matched = []
            for t in trades:
                if not t.close_time:
                    continue
                if t.symbol != interval.symbol:
                    continue
                hour = t.close_time.hour
                minute = t.close_time.minute
                start = interval.start_hour * 60 + interval.start_minute
                end = interval.end_hour * 60 + interval.end_minute
                current = hour * 60 + minute
                if start <= current <= end:
                    matched.append(t)

            if matched:
                result[f"{interval.name} [{interval.label or '-'}]"] = self._summarize(matched)

        return result

    # ═════════════════════════════════════════════
    # خلاصه‌سازی
    # ═════════════════════════════════════════════
    def _summarize(self, trades: List[Trade]) -> Dict[str, Any]:
        """خلاصه‌ی متریک‌های یک گروه از معاملات"""
        total = len(trades)
        wins = [t for t in trades if t.pnl and t.pnl > 0]
        losses = [t for t in trades if t.pnl and t.pnl < 0]

        gross_profit = sum(t.pnl for t in wins) if wins else 0
        gross_loss = abs(sum(t.pnl for t in losses)) if losses else 0

        net_pnl = sum(t.pnl for t in trades if t.pnl) or 0
        win_rate = (len(wins) / total * 100) if total > 0 else 0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0

        return {
            "total_trades": total,
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": round(win_rate, 2),
            "net_pnl": round(net_pnl, 2),
            "profit_factor": round(profit_factor, 2),
        }