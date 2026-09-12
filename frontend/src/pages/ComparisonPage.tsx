import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import {
  getAllVersions,
  getStrategies,
  compareVersionsWithDetails,
} from '../api/client';

interface Version {
  id: number;
  version_name: string;
  strategy_id: number;
  strategy_name: string;
  status: string;
  trades_count: number;
}

interface Strategy {
  id: number;
  name: string;
}

export default function ComparisonPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterStrategy, setFilterStrategy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'session' | 'weekday' | 'hour' | 'custom'>('session');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [versionsRes, strategiesRes] = await Promise.all([
        getAllVersions(),
        getStrategies(),
      ]);
      setVersions(versionsRes.data);
      setStrategies(strategiesRes.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const toggleVersion = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((v) => v !== id));
    } else {
      if (selectedIds.length >= 5) {
        setError('حداکثر ۵ نسخه قابل مقایسه است');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('حداقل ۲ نسخه برای مقایسه انتخاب کنید');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await compareVersionsWithDetails(selectedIds);
      setComparison(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در مقایسه');
    } finally {
      setLoading(false);
    }
  };

  const filteredVersions = versions.filter((v) => {
    if (filterStrategy && v.strategy_id !== filterStrategy) return false;
    if (searchQuery && !v.version_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.strategy_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCellColor = (item: any, allItems: any[], metric: string, higherIsBetter: boolean = true) => {
    if (allItems.length < 2) return 'text-text-primary';
    const values = allItems.map((i: any) => i[metric]);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const val = item[metric];
    if (higherIsBetter) {
      if (val === maxVal) return 'text-profit font-bold';
      if (val === minVal) return 'text-loss';
    } else {
      if (val === minVal) return 'text-profit font-bold';
      if (val === maxVal) return 'text-loss';
    }
    return 'text-text-primary';
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-loss/10 border border-loss/30 text-loss p-3 rounded-xl">
          ❌ {error}
        </div>
      )}

      {/* بخش انتخاب */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-bold mb-4">📊 انتخاب نسخه‌ها برای مقایسه</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-text-secondary text-xs block mb-1">استراتژی</label>
            <select
              value={filterStrategy || ''}
              onChange={(e) => setFilterStrategy(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">همه‌ی استراتژی‌ها</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-text-secondary text-xs block mb-1">جستجو</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجوی نام نسخه یا استراتژی..."
              className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* لیست نسخه‌ها */}
        <div className="max-h-64 overflow-y-auto border border-card-border rounded-xl p-2 mb-4">
          {filteredVersions.length === 0 ? (
            <div className="text-text-secondary text-sm text-center py-4">
              نسخه‌ای یافت نشد
            </div>
          ) : (
            <div className="space-y-1">
              {filteredVersions.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    selectedIds.includes(v.id)
                      ? 'bg-accent/20 border border-accent'
                      : 'hover:bg-card/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(v.id)}
                      onChange={() => toggleVersion(v.id)}
                      className="w-4 h-4 accent-accent"
                    />
                    <div>
                      <div className="text-text-primary text-sm font-bold">
                        {v.strategy_name} / {v.version_name}
                      </div>
                      <div className="text-text-secondary text-xs">
                        {v.trades_count} معامله • وضعیت: {v.status}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-text-secondary text-sm">
            انتخاب‌شده: <span className="text-accent font-bold">{selectedIds.length}</span> از ۵
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="bg-card-border hover:bg-card-border/80 text-text-secondary px-4 py-2 rounded-xl text-sm"
            >
              پاک کردن
            </button>
            <button
              onClick={handleCompare}
              disabled={loading || selectedIds.length < 2}
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? '⏳ در حال مقایسه...' : '🚀 مقایسه کن'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* نتیجه‌ی مقایسه */}
      {comparison && (
        <>
          {/* جدول مقایسه */}
          <GlassCard className="mb-6">
            <h3 className="text-text-primary font-bold mb-4">
              📋 جدول مقایسه ({comparison.items.length} نسخه)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-secondary border-b border-card-border">
                    <th className="text-right py-3">معیار</th>
                    {comparison.items.map((item: any) => (
                      <th key={item.version_id} className="text-right py-3">
                        <div className="font-bold text-text-primary">{item.version_name}</div>
                        <div className="text-xs">{item.strategy_name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary">تعداد معاملات</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className="py-3 text-text-primary">
                        {item.total_trades}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary">🥇 نرخ برد</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-3 ${getCellColor(item, comparison.items, 'win_rate')}`}>
                        {item.win_rate}٪
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary">💰 سود خالص</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-3 ${getCellColor(item, comparison.items, 'net_pnl')}`}>
                        {item.net_pnl >= 0 ? '+' : ''}{item.net_pnl} $
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary">🏆 فاکتور سود</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-3 ${getCellColor(item, comparison.items, 'profit_factor')}`}>
                        {item.profit_factor}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary">🛡️ حداکثر DD</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-3 ${getCellColor(item, comparison.items, 'max_dd', false)}`}>
                        -{item.max_dd} $
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="py-3 text-text-secondary font-bold">⭐ امتیاز</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-3 font-bold ${getCellColor(item, comparison.items, 'score')}`}>
                        {item.score}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* پیشنهاد هوشمند */}
          <GlassCard className="mb-6">
            <h3 className="text-text-primary font-bold mb-4">💡 پیشنهاد هوشمند</h3>

            <div className="bg-gradient-to-l from-accent/10 to-profit/10 border border-accent/30 rounded-xl p-5 mb-4">
              <div className="text-xl font-bold text-text-primary mb-1">
                🏆 {comparison.best_version_name}
              </div>
              <div className="text-accent font-bold mb-3">
                امتیاز: {comparison.best_score} از ۱۰۰
              </div>
              <div className="text-text-secondary text-sm">
                {comparison.recommendation}
              </div>
            </div>

            {comparison.reasons && comparison.reasons.length > 0 && (
              <div>
                <h4 className="text-text-primary font-bold mb-3">📊 دلایل برتری:</h4>
                <div className="space-y-2">
                  {comparison.reasons.map((reason: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-card border border-card-border rounded-xl p-3">
                      <span className="text-xl">{reason.icon}</span>
                      <span className="text-text-primary text-sm">{reason.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* بهترین نسخه برای هر نماد */}
          {comparison.symbol_bests && comparison.symbol_bests.length > 0 && (
            <GlassCard className="mb-6">
              <h3 className="text-text-primary font-bold mb-4">🥇 بهترین نسخه برای هر نماد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.symbol_bests.map((sb: any, idx: number) => (
                  <div key={idx} className="bg-card border border-card-border rounded-xl p-4">
                    <div className="text-text-primary font-bold mb-2">{sb.symbol_label}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🥇</span>
                      <div>
                        <div className="text-profit font-bold">{sb.best_version_name}</div>
                        <div className="text-text-secondary text-xs">{sb.best_strategy}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-text-secondary">نرخ برد</div>
                        <div className="text-text-primary font-bold">{sb.win_rate}٪</div>
                      </div>
                      <div>
                        <div className="text-text-secondary">سود خالص</div>
                        <div className={`font-bold ${sb.net_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {sb.net_pnl >= 0 ? '+' : ''}{sb.net_pnl} $
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* مقایسه‌ی تفکیکی */}
          {comparison.detail_bests && (
            <GlassCard>
              <h3 className="text-text-primary font-bold mb-4">📈 بهترین نسخه در هر بخش</h3>

              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { key: 'session', label: '🌍 سشن‌ها' },
                  { key: 'weekday', label: '📅 روزهای هفته' },
                  { key: 'hour', label: '🕐 ساعت‌ها' },
                  { key: 'custom', label: '⏰ بازه‌های سفارشی' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDetailTab(tab.key as any)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      activeDetailTab === tab.key
                        ? 'bg-accent text-white'
                        : 'bg-card border border-card-border text-text-secondary hover:border-accent/30'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {comparison.detail_bests[activeDetailTab === 'custom' ? 'custom_interval' : activeDetailTab]?.map(
                  (detail: any, idx: number) => (
                    <div key={idx} className="bg-card border border-card-border rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                      <div className="text-text-primary font-bold text-sm">{detail.name}</div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-text-secondary">نسخه</div>
                          <div className="text-profit font-bold">{detail.best.version_name}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-text-secondary">نرخ برد</div>
                          <div className="text-text-primary font-bold">{detail.best.win_rate}٪</div>
                        </div>
                        <div className="text-center">
                          <div className="text-text-secondary">سود</div>
                          <div className={`font-bold ${detail.best.net_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {detail.best.net_pnl >= 0 ? '+' : ''}{detail.best.net_pnl} $
                          </div>
                        </div>
                        {detail.best.total_trades !== undefined && (
                          <div className="text-center">
                            <div className="text-text-secondary">معاملات</div>
                            <div className="text-text-primary">{detail.best.total_trades}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
                {comparison.detail_bests[activeDetailTab === 'custom' ? 'custom_interval' : activeDetailTab]?.length === 0 && (
                  <div className="text-text-secondary text-sm text-center py-4">
                    داده‌ای برای این بخش وجود ندارد
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}