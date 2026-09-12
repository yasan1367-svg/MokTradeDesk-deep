import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import MetricCard from '../components/MetricCard';
import AnalysisTable from '../components/AnalysisTable';
import {
  getAllVersions,
  getVersionAnalysis,
  getVersionTrades,
  analyzeVersion,
} from '../api/client';

interface Version {
  id: number;
  version_name: string;
  strategy_name: string;
}

export default function AnalysisPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═════════════════════════════════════════════
  // ۱. بارگذاری لیست نسخه‌ها (بدون شرط)
  // ═════════════════════════════════════════════
  useEffect(() => {
    getAllVersions()
      .then((res) => {
        setVersions(res.data);
        if (res.data.length > 0) {
          setSelectedVersion(res.data[0].id);
        }
      })
      .catch((err) => console.error('خطا در دریافت نسخه‌ها:', err));
  }, []);

  // ═════════════════════════════════════════════
  // ۲. بارگذاری تحلیل و معاملات (با شرط selectedVersion)
  // ═════════════════════════════════════════════
  useEffect(() => {
    if (!selectedVersion) return;

    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        let analysisData: any = null;
        let tradesData: any[] = [];

        try {
          const analysisRes = await getVersionAnalysis(selectedVersion);
          analysisData = analysisRes.data;
        } catch (e) {
          console.log('تحلیلی یافت نشد');
        }

        try {
          const tradesRes = await getVersionTrades(selectedVersion);
          tradesData = tradesRes.data;
        } catch (e) {
          console.log('معامله‌ای یافت نشد');
        }

        setAnalysis(analysisData);
        setTrades(tradesData);
      } catch (err) {
        setError('خطا در بارگذاری داده‌ها');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedVersion]);

  // ═════════════════════════════════════════════
  // اجرای مجدد تحلیل
  // ═════════════════════════════════════════════
  const handleReanalyze = async () => {
    if (!selectedVersion) return;

    setLoading(true);
    setError(null);
    try {
      await analyzeVersion(selectedVersion);
      const res = await getVersionAnalysis(selectedVersion);
      setAnalysis(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در تحلیل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* انتخاب نسخه */}
      <GlassCard className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="text-text-secondary text-sm block mb-2">انتخاب نسخه</label>
            <select
              value={selectedVersion || ''}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            >
              {versions.length === 0 ? (
                <option value="">— نسخه‌ای وجود ندارد —</option>
              ) : (
                versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.strategy_name} / {v.version_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleReanalyze}
            disabled={loading || !selectedVersion}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 mt-6"
          >
            {loading ? '⏳ در حال تحلیل...' : '🔄 تحلیل مجدد'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-loss/10 border border-loss/30 text-loss p-3 rounded-xl text-sm">
            ❌ {error}
          </div>
        )}
      </GlassCard>

      {analysis ? (
        <>
          {/* متریک‌های پایه */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <MetricCard
              label="💰 سود خالص"
              value={`${analysis.net_pnl >= 0 ? '+' : ''}${analysis.net_pnl} $`}
              sub={`از ${analysis.total_trades} معامله`}
              color={analysis.net_pnl >= 0 ? 'profit' : 'loss'}
              icon="💰"
            />
            <MetricCard
              label="📈 نرخ برد"
              value={`${analysis.win_rate}٪`}
              sub={`${Math.round((analysis.win_rate / 100) * analysis.total_trades)} برد`}
              icon="📈"
            />
            <MetricCard
              label="🏆 فاکتور سود"
              value={analysis.profit_factor}
              sub="سود کل / ضرر کل"
              color="accent"
              icon="🏆"
            />
            <MetricCard
              label="⚠️ حداکثر ضرر"
              value={`-${analysis.max_dd} $`}
              sub="کمترین نقطه‌ی منحنی"
              color="loss"
              icon="⚠️"
            />
          </div>

          {/* تحلیل‌های تفکیکی */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AnalysisTable
              title="تحلیل سشن‌ها"
              icon="🌍"
              data={analysis.session_analysis || {}}
              firstColumnLabel="سشن"
            />
            <AnalysisTable
              title="تحلیل روزهای هفته"
              icon="📅"
              data={analysis.weekday_analysis || {}}
              firstColumnLabel="روز"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AnalysisTable
              title="تحلیل ساعت‌ها"
              icon="🕐"
              data={analysis.hour_analysis || {}}
              firstColumnLabel="ساعت"
            />
            <AnalysisTable
              title="تحلیل بازه‌های سفارشی"
              icon="⏰"
              data={analysis.custom_time_analysis || {}}
              firstColumnLabel="بازه"
            />
          </div>

          {/* جدول معاملات */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text-primary font-bold">
                📋 لیست معاملات ({trades.length})
              </h3>
            </div>

            {trades.length === 0 ? (
              <div className="text-text-secondary text-sm text-center py-8">
                معامله‌ای برای این نسخه ثبت نشده است
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary border-b border-card-border">
                      <th className="text-right py-2">#</th>
                      <th className="text-right py-2">نماد</th>
                      <th className="text-right py-2">نوع تست</th>
                      <th className="text-right py-2">جهت</th>
                      <th className="text-right py-2">حجم</th>
                      <th className="text-right py-2">قیمت باز</th>
                      <th className="text-right py-2">قیمت بسته</th>
                      <th className="text-right py-2">سود/زیان</th>
                      <th className="text-right py-2">تاریخ بسته</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, idx) => (
                      <tr key={t.id} className="border-b border-card-border/50 hover:bg-card/50">
                        <td className="py-2 text-text-secondary">{idx + 1}</td>
                        <td className="py-2 text-text-primary font-bold">{t.symbol}</td>
                        <td className="py-2">
                          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                            {t.test_type === 'backtest' ? 'بک‌تست' :
                             t.test_type === 'forward' ? 'فوروارد' : 'رییل'}
                          </span>
                        </td>
                        <td className={`py-2 ${t.direction === 'buy' ? 'text-profit' : 'text-loss'}`}>
                          {t.direction === 'buy' ? 'خرید' : 'فروش'}
                        </td>
                        <td className="py-2 text-text-primary">{t.size}</td>
                        <td className="py-2 text-text-primary">{t.open_price?.toFixed(2)}</td>
                        <td className="py-2 text-text-primary">{t.close_price?.toFixed(2)}</td>
                        <td className={`py-2 font-bold ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(2)} $
                        </td>
                        <td className="py-2 text-text-secondary text-xs">
                          {t.close_time ? new Date(t.close_time).toLocaleString('fa-IR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      ) : (
        !loading && (
          <GlassCard>
            <div className="text-center py-12 text-text-secondary">
              <div className="text-4xl mb-4">📊</div>
              <div>برای مشاهده‌ی تحلیل، یک نسخه انتخاب کنید و روی "تحلیل مجدد" کلیک کنید</div>
            </div>
          </GlassCard>
        )
      )}
    </div>
  );
}