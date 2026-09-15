import { useState, useEffect } from 'react';
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

  const getCellStyle = (item: any, allItems: any[], metric: string, higherIsBetter: boolean = true) => {
    if (allItems.length < 2) return 'text-[#1A2B47]';
    const values = allItems.map((i: any) => i[metric]);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const val = item[metric];
    if (higherIsBetter) {
      if (val === maxVal) return 'text-[#13AE81] font-extrabold';
      if (val === minVal) return 'text-[#E45D72] font-bold';
    } else {
      if (val === minVal) return 'text-[#13AE81] font-extrabold';
      if (val === maxVal) return 'text-[#E45D72] font-bold';
    }
    return 'text-[#1A2B47] font-semibold';
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-[#FFEDF0] border border-[#F0A6B2] text-[#E45D72] p-4 rounded-[14px] text-sm font-semibold shadow-sm">
          ❌ {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          بخش انتخاب
      ═══════════════════════════════════════════ */}
      <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-[14px] bg-[#EDF3FF] flex items-center justify-center text-xl shadow-[0_4px_12px_rgba(63,124,255,0.12)]">
            ⚖️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#1A2B47]">انتخاب نسخه‌ها برای مقایسه</h2>
            <p className="text-[12px] text-[#6B7A94] mt-0.5">حداقل ۲ و حداکثر ۵ نسخه را انتخاب کنید</p>
          </div>
        </div>

        {/* فیلترها */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="text-[12px] text-[#6B7A94] font-semibold block mb-1.5">استراتژی</label>
            <select
              value={filterStrategy || ''}
              onChange={(e) => setFilterStrategy(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-[#F8FAFF] border border-[#E5EBF3] rounded-[10px] px-4 py-2.5 text-[#1A2B47] text-sm font-medium focus:border-[#3F7CFF] focus:outline-none focus:ring-2 focus:ring-[#EDF3FF]"
            >
              <option value="">همه‌ی استراتژی‌ها</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[12px] text-[#6B7A94] font-semibold block mb-1.5">جستجو</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجوی نام نسخه یا استراتژی..."
              className="w-full bg-[#F8FAFF] border border-[#E5EBF3] rounded-[10px] px-4 py-2.5 text-[#1A2B47] text-sm font-medium focus:border-[#3F7CFF] focus:outline-none focus:ring-2 focus:ring-[#EDF3FF]"
            />
          </div>
        </div>

        {/* لیست نسخه‌ها */}
        <div className="max-h-72 overflow-y-auto border border-[#E5EBF3] rounded-[14px] p-2 mb-5 bg-[#F8FAFF]">
          {filteredVersions.length === 0 ? (
            <div className="text-[#9AA8BF] text-sm text-center py-8">نسخه‌ای یافت نشد</div>
          ) : (
            <div className="space-y-1.5">
              {filteredVersions.map((v) => {
                const isSelected = selectedIds.includes(v.id);
                return (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between p-3 rounded-[12px] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#EDF3FF] border-2 border-[#3F7CFF] shadow-[0_4px_12px_rgba(63,124,255,0.15)]'
                        : 'bg-white border border-[#E5EBF3] hover:border-[#A9C1FA] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleVersion(v.id)}
                        className="w-5 h-5 accent-[#3F7CFF] cursor-pointer"
                      />
                      <div>
                        <div className="text-[14px] font-bold text-[#1A2B47]">
                          {v.strategy_name} / {v.version_name}
                        </div>
                        <div className="text-[11px] text-[#6B7A94] mt-0.5">
                          {v.trades_count} معامله • وضعیت: {v.status}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#3F7CFF] text-white">
                        انتخاب‌شده
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="text-[13px] text-[#6B7A94] font-medium">
            انتخاب‌شده: <span className="text-[#3F7CFF] font-extrabold text-base">{selectedIds.length}</span> از ۵
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="bg-white border border-[#E5EBF3] hover:border-[#A9C1FA] text-[#6B7A94] hover:text-[#3F7CFF] px-5 py-2.5 rounded-[10px] text-sm font-bold transition-all"
            >
              ✕ پاک کردن
            </button>
            <button
              onClick={handleCompare}
              disabled={loading || selectedIds.length < 2}
              className="text-white px-7 py-2.5 rounded-[10px] text-sm font-extrabold transition-all shadow-[0_6px_16px_rgba(63,124,255,0.3)] hover:shadow-[0_10px_24px_rgba(63,124,255,0.4)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
            >
              {loading ? '⏳ در حال مقایسه...' : '🚀 مقایسه کن'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          نتیجه
      ═══════════════════════════════════════════ */}
      {comparison && (
        <>
          {/* جدول مقایسه */}
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
              <div className="w-11 h-11 rounded-[14px] bg-[#EDF3FF] flex items-center justify-center text-xl">
                📋
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">جدول مقایسه</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">{comparison.items.length} نسخه</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[14px] border border-[#E5EBF3]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F7FB]">
                    <th className="text-right py-4 px-5 text-[12px] text-[#6B7A94] font-extrabold uppercase tracking-wider rounded-r-[14px]">
                      معیار
                    </th>
                    {comparison.items.map((item: any) => (
                      <th key={item.version_id} className="text-right py-4 px-5 rounded-l-[14px]">
                        <div className="font-extrabold text-[14px] text-[#1A2B47]">{item.version_name}</div>
                        <div className="text-[11px] text-[#6B7A94] font-medium mt-0.5">{item.strategy_name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#6B7A94] font-semibold">تعداد معاملات</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className="py-4 px-5 text-[14px] font-bold text-[#1A2B47]">
                        {item.total_trades}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#6B7A94] font-semibold">🥇 نرخ برد</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-4 px-5 text-[14px] ${getCellStyle(item, comparison.items, 'win_rate')}`}>
                        {item.win_rate}٪
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#6B7A94] font-semibold">💰 سود خالص</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-4 px-5 text-[14px] ${getCellStyle(item, comparison.items, 'net_pnl')}`}>
                        {item.net_pnl >= 0 ? '+' : ''}{item.net_pnl} $
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#6B7A94] font-semibold">🏆 فاکتور سود</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-4 px-5 text-[14px] ${getCellStyle(item, comparison.items, 'profit_factor')}`}>
                        {item.profit_factor}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#6B7A94] font-semibold">🛡️ حداکثر DD</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-4 px-5 text-[14px] ${getCellStyle(item, comparison.items, 'max_dd', false)}`}>
                        -{item.max_dd} $
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[#EDF3FF]/50">
                    <td className="py-4 px-5 text-[13px] text-[#1A2B47] font-extrabold">⭐ امتیاز کل</td>
                    {comparison.items.map((item: any) => (
                      <td key={item.version_id} className={`py-4 px-5 text-[16px] ${getCellStyle(item, comparison.items, 'score')}`}>
                        {item.score}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* پیشنهاد هوشمند */}
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF5DB] flex items-center justify-center text-xl">
                💡
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">پیشنهاد هوشمند</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">تحلیل خودکار بهترین نسخه</p>
              </div>
            </div>

            <div
              className="rounded-[18px] p-6 mb-5 border border-[#A9C1FA] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #EDF3FF 0%, #F0F6FF 100%)' }}
            >
              <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #3F7CFF, #7959D6)' }} />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[22px] font-extrabold text-[#1A2B47] mb-1">
                    🏆 {comparison.best_version_name}
                  </div>
                  <div className="text-[14px] text-[#6B7A94] font-medium">
                    {comparison.recommendation}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-[#6B7A94] font-semibold mb-1">امتیاز کل</div>
                  <div className="text-[36px] font-extrabold accent-gradient-text leading-none">
                    {comparison.best_score}
                  </div>
                </div>
              </div>
            </div>

            {/* دلایل */}
            {comparison.reasons && comparison.reasons.length > 0 && (
              <div>
                <h4 className="text-[14px] font-extrabold text-[#1A2B47] mb-3">📊 دلایل برتری:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparison.reasons.map((reason: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-[#F8FAFF] border border-[#E5EBF3] rounded-[14px] p-4 hover:border-[#A9C1FA] hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-[12px] bg-white flex items-center justify-center text-xl shadow-sm shrink-0">
                        {reason.icon}
                      </div>
                      <span className="text-[13px] text-[#1A2B47] font-medium leading-relaxed pt-2">{reason.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* بهترین نسخه برای هر نماد */}
          {comparison.symbol_bests && comparison.symbol_bests.length > 0 && (
            <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-[14px] bg-[#E5F8F1] flex items-center justify-center text-xl">
                  🥇
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A2B47]">بهترین نسخه برای هر نماد</h3>
                  <p className="text-[12px] text-[#6B7A94] mt-0.5">بر اساس امتیاز کلی</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.symbol_bests.map((sb: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-bl from-[#E5F8F1] to-[#F0FDF9] border border-[#A8E6CF] rounded-[18px] p-5 hover:shadow-md transition-all"
                  >
                    <div className="text-[15px] font-extrabold text-[#1A2B47] mb-4">{sb.symbol_label}</div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center text-2xl shadow-sm">
                        🥇
                      </div>
                      <div>
                        <div className="text-[15px] font-extrabold text-[#13AE81]">{sb.best_version_name}</div>
                        <div className="text-[11px] text-[#6B7A94] font-medium mt-0.5">{sb.best_strategy}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/60 rounded-[10px] p-3">
                        <div className="text-[10px] text-[#6B7A94] font-semibold mb-1">نرخ برد</div>
                        <div className="text-[16px] font-extrabold text-[#1A2B47]">{sb.win_rate}٪</div>
                      </div>
                      <div className="bg-white/60 rounded-[10px] p-3">
                        <div className="text-[10px] text-[#6B7A94] font-semibold mb-1">سود خالص</div>
                        <div className={`text-[16px] font-extrabold ${sb.net_pnl >= 0 ? 'text-[#13AE81]' : 'text-[#E45D72]'}`}>
                          {sb.net_pnl >= 0 ? '+' : ''}{sb.net_pnl} $
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* مقایسه‌ی تفکیکی */}
          {comparison.detail_bests && (
            <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-[14px] bg-[#F1ECFF] flex items-center justify-center text-xl">
                  📈
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A2B47]">بهترین نسخه در هر بخش</h3>
                  <p className="text-[12px] text-[#6B7A94] mt-0.5">تفکیک‌شده بر اساس سشن، روز، ساعت و بازه</p>
                </div>
              </div>

              {/* تب‌ها */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { key: 'session', label: '🌍 سشن‌ها' },
                  { key: 'weekday', label: '📅 روزهای هفته' },
                  { key: 'hour', label: '🕐 ساعت‌ها' },
                  { key: 'custom', label: '⏰ بازه‌های سفارشی' },
                ].map((tab) => {
                  const isActive = activeDetailTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveDetailTab(tab.key as any)}
                      className={`px-5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                        isActive
                          ? 'text-white shadow-[0_6px_16px_rgba(63,124,255,0.3)]'
                          : 'bg-[#F8FAFF] border border-[#E5EBF3] text-[#6B7A94] hover:border-[#A9C1FA] hover:text-[#3F7CFF]'
                      }`}
                      style={isActive ? { background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' } : {}}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {comparison.detail_bests[activeDetailTab === 'custom' ? 'custom_interval' : activeDetailTab]?.map(
                  (detail: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#F8FAFF] border border-[#E5EBF3] rounded-[14px] p-4 flex justify-between items-center flex-wrap gap-4 hover:border-[#A9C1FA] hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="text-[14px] font-extrabold text-[#1A2B47] min-w-[140px]">
                        {detail.name}
                      </div>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="text-center">
                          <div className="text-[10px] text-[#6B7A94] font-bold mb-1">نسخه برتر</div>
                          <div className="text-[14px] font-extrabold text-[#13AE81]">{detail.best.version_name}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-[#6B7A94] font-bold mb-1">نرخ برد</div>
                          <div className="text-[14px] font-extrabold text-[#1A2B47]">{detail.best.win_rate}٪</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-[#6B7A94] font-bold mb-1">سود</div>
                          <div className={`text-[14px] font-extrabold ${detail.best.net_pnl >= 0 ? 'text-[#13AE81]' : 'text-[#E45D72]'}`}>
                            {detail.best.net_pnl >= 0 ? '+' : ''}{detail.best.net_pnl} $
                          </div>
                        </div>
                        {detail.best.total_trades !== undefined && (
                          <div className="text-center">
                            <div className="text-[10px] text-[#6B7A94] font-bold mb-1">معاملات</div>
                            <div className="text-[14px] font-extrabold text-[#1A2B47]">{detail.best.total_trades}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
                {comparison.detail_bests[activeDetailTab === 'custom' ? 'custom_interval' : activeDetailTab]?.length === 0 && (
                  <div className="text-[#9AA8BF] text-sm text-center py-8">
                    داده‌ای برای این بخش وجود ندارد
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}