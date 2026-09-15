import { useState, useEffect } from 'react';
import {
  getStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  getStrategyVersions,
  createVersion,
  updateVersion,
  deleteVersion,
} from '../api/client';

interface Strategy {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  versions_count: number;
}

interface Version {
  id: number;
  version_name: string;
  strategy_id: number;
  rules_note: string | null;
  status: string;
  trades_count: number;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'research', label: '🔬 تحقیق' },
  { value: 'backtest', label: '🧪 بک‌تست' },
  { value: 'optimization', label: '⚙️ بهینه‌سازی' },
  { value: 'forward', label: '🔭 فوروارد' },
  { value: 'approved', label: '✅ تأییدشده' },
  { value: 'live', label: '💰 لایو' },
  { value: 'deprecated', label: '⛔ منسوخ' },
  { value: 'archived', label: '📦 آرشیو' },
  { value: 'rejected', label: '❌ ردشده' },
];

const getStatusLabel = (status: string) => {
  const found = STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    research: 'bg-[#F1ECFF] text-[#7959D6] border-[#D5C8F5]',
    backtest: 'bg-[#EDF3FF] text-[#3F7CFF] border-[#A9C1FA]',
    optimization: 'bg-[#EDF3FF] text-[#3F7CFF] border-[#A9C1FA]',
    forward: 'bg-[#EDF3FF] text-[#3F7CFF] border-[#A9C1FA]',
    approved: 'bg-[#E5F8F1] text-[#13AE81] border-[#A8E6CF]',
    live: 'bg-[#E5F8F1] text-[#13AE81] border-[#A8E6CF]',
    deprecated: 'bg-[#FFEDF0] text-[#E45D72] border-[#F0A6B2]',
    archived: 'bg-[#F5F7FB] text-[#6B7A94] border-[#E5EBF3]',
    rejected: 'bg-[#FFEDF0] text-[#E45D72] border-[#F0A6B2]',
  };
  return styles[status] || styles.archived;
};

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);

  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null);
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');

  const [showVersionForm, setShowVersionForm] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionRules, setVersionRules] = useState('');
  const [versionStatus, setVersionStatus] = useState('research');

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const res = await getStrategies();
      setStrategies(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const loadVersions = async (strategyId: number) => {
    try {
      const res = await getStrategyVersions(strategyId);
      setVersions(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const handleSelectStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    loadVersions(strategy.id);
    setShowVersionForm(false);
  };

  // ═════════════════════════════════════════════
  // Strategy CRUD
  // ═════════════════════════════════════════════
  const handleOpenStrategyForm = (strategy?: Strategy) => {
    if (strategy) {
      setEditingStrategyId(strategy.id);
      setStrategyName(strategy.name);
      setStrategyDescription(strategy.description || '');
    } else {
      setEditingStrategyId(null);
      setStrategyName('');
      setStrategyDescription('');
    }
    setShowStrategyForm(true);
  };

  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      setError('نام استراتژی نمی‌تواند خالی باشد');
      return;
    }
    try {
      if (editingStrategyId) {
        await updateStrategy(editingStrategyId, {
          name: strategyName,
          description: strategyDescription,
        });
        setSuccessMessage('استراتژی به‌روزرسانی شد');
      } else {
        await createStrategy({
          name: strategyName,
          description: strategyDescription,
        });
        setSuccessMessage('استراتژی جدید ساخته شد');
      }
      setShowStrategyForm(false);
      await loadStrategies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ذخیره‌ی استراتژی');
    }
  };

  const handleDeleteStrategy = async (strategy: Strategy) => {
    if (!confirm(`آیا مطمئنید که می‌خواهید «${strategy.name}» را حذف کنید؟\nتمام نسخه‌های آن نیز حذف می‌شوند.`)) return;
    try {
      await deleteStrategy(strategy.id);
      setSuccessMessage('استراتژی حذف شد');
      if (selectedStrategy?.id === strategy.id) {
        setSelectedStrategy(null);
        setVersions([]);
      }
      await loadStrategies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در حذف استراتژی');
    }
  };

  // ═════════════════════════════════════════════
  // Version CRUD
  // ═════════════════════════════════════════════
  const handleOpenVersionForm = (version?: Version) => {
    if (version) {
      setEditingVersionId(version.id);
      setVersionName(version.version_name);
      setVersionRules(version.rules_note || '');
      setVersionStatus(version.status);
    } else {
      setEditingVersionId(null);
      setVersionName('');
      setVersionRules('');
      setVersionStatus('research');
    }
    setShowVersionForm(true);
  };

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      setError('نام نسخه نمی‌تواند خالی باشد');
      return;
    }
    if (!selectedStrategy) return;
    try {
      if (editingVersionId) {
        await updateVersion(editingVersionId, {
          version_name: versionName,
          rules_note: versionRules,
          status: versionStatus,
        });
        setSuccessMessage('نسخه به‌روزرسانی شد');
      } else {
        await createVersion(selectedStrategy.id, {
          version_name: versionName,
          rules_note: versionRules,
        });
        setSuccessMessage('نسخه‌ی جدید ساخته شد');
      }
      setShowVersionForm(false);
      await loadVersions(selectedStrategy.id);
      await loadStrategies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ذخیره‌ی نسخه');
    }
  };

  const handleDeleteVersion = async (version: Version) => {
    if (version.trades_count > 0) {
      setError(`این نسخه ${version.trades_count} معامله دارد و قابل حذف نیست`);
      return;
    }
    if (!confirm(`آیا مطمئنید که می‌خواهید «${version.version_name}» را حذف کنید؟`)) return;
    try {
      await deleteVersion(version.id);
      setSuccessMessage('نسخه حذف شد');
      if (selectedStrategy) await loadVersions(selectedStrategy.id);
      await loadStrategies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در حذف نسخه');
    }
  };

  const filteredStrategies = strategies.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-[#FFEDF0] border border-[#F0A6B2] text-[#E45D72] p-4 rounded-[14px] text-sm font-semibold shadow-sm">
          ❌ {error}
          <button onClick={() => setError(null)} className="float-left text-xs font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-[#E5F8F1] border border-[#A8E6CF] text-[#13AE81] p-4 rounded-[14px] text-sm font-semibold shadow-sm">
          ✅ {successMessage}
        </div>
      )}

      {/* دکمه‌ها و جستجو */}
      <div className="flex gap-3 flex-wrap items-center">
        <button
          onClick={() => handleOpenStrategyForm()}
          className="text-white px-6 py-3 rounded-[12px] text-sm font-extrabold transition-all shadow-[0_6px_16px_rgba(63,124,255,0.3)] hover:shadow-[0_10px_24px_rgba(63,124,255,0.4)] hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
        >
          ➕ استراتژی جدید
        </button>
        <div className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجوی استراتژی..."
            className="w-full bg-white border border-[#E5EBF3] rounded-[12px] px-5 py-3 text-[#1A2B47] text-sm font-medium shadow-sm focus:border-[#3F7CFF] focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
          />
        </div>
      </div>

      {/* فرم استراتژی */}
      {showStrategyForm && (
        <div className="bg-white border-2 border-[#3F7CFF] rounded-[22px] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5EBF3]">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white"
              style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}>
              {editingStrategyId ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1A2B47]">
                {editingStrategyId ? 'ویرایش استراتژی' : 'ساخت استراتژی جدید'}
              </h3>
              <p className="text-[12px] text-[#6B7A94] mt-0.5">نام و توضیحات را وارد کنید</p>
            </div>
          </div>

          <div className="space-y-5 mb-6">
            <div>
              <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                نام استراتژی <span className="text-[#E45D72]">*</span>
              </label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="مثلاً SP2L"
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                توضیحات
              </label>
              <textarea
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="توضیحات استراتژی..."
                rows={3}
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-medium focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E5EBF3]">
            <button
              onClick={handleSaveStrategy}
              className="text-white px-7 py-3 rounded-[12px] text-sm font-extrabold transition-all shadow-[0_6px_16px_rgba(19,174,129,0.3)] hover:shadow-[0_10px_24px_rgba(19,174,129,0.4)] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #13AE81, #4DD9A9)' }}
            >
              💾 ذخیره
            </button>
            <button
              onClick={() => setShowStrategyForm(false)}
              className="bg-white border-2 border-[#E5EBF3] hover:border-[#A9C1FA] text-[#6B7A94] hover:text-[#3F7CFF] px-7 py-3 rounded-[12px] text-sm font-bold transition-all"
            >
              ✕ لغو
            </button>
          </div>
        </div>
      )}

      {/* فرم نسخه */}
      {showVersionForm && selectedStrategy && (
        <div className="bg-white border-2 border-[#3F7CFF] rounded-[22px] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5EBF3]">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white"
              style={{ background: 'linear-gradient(135deg, #7959D6, #A78BFA)' }}>
              {editingVersionId ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1A2B47]">
                {editingVersionId ? 'ویرایش نسخه' : `ساخت نسخه‌ی جدید برای «${selectedStrategy.name}»`}
              </h3>
              <p className="text-[12px] text-[#6B7A94] mt-0.5">نام، قوانین و وضعیت را وارد کنید</p>
            </div>
          </div>

          <div className="space-y-5 mb-6">
            <div>
              <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                نام نسخه <span className="text-[#E45D72]">*</span>
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="مثلاً SP2L_TP1.5"
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
              />
            </div>

            <div>
              <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                قوانین / توضیحات
              </label>
              <textarea
                value={versionRules}
                onChange={(e) => setVersionRules(e.target.value)}
                placeholder="قوانین این نسخه..."
                rows={4}
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-medium focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all resize-none"
              />
            </div>

            {editingVersionId && (
              <div>
                <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                  وضعیت
                </label>
                <select
                  value={versionStatus}
                  onChange={(e) => setVersionStatus(e.target.value)}
                  className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E5EBF3]">
            <button
              onClick={handleSaveVersion}
              className="text-white px-7 py-3 rounded-[12px] text-sm font-extrabold transition-all shadow-[0_6px_16px_rgba(19,174,129,0.3)] hover:shadow-[0_10px_24px_rgba(19,174,129,0.4)] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #13AE81, #4DD9A9)' }}
            >
              💾 ذخیره
            </button>
            <button
              onClick={() => setShowVersionForm(false)}
              className="bg-white border-2 border-[#E5EBF3] hover:border-[#A9C1FA] text-[#6B7A94] hover:text-[#3F7CFF] px-7 py-3 rounded-[12px] text-sm font-bold transition-all"
            >
              ✕ لغو
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* لیست استراتژی‌ها */}
        <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
            <div className="w-11 h-11 rounded-[14px] bg-[#EDF3FF] flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1A2B47]">استراتژی‌ها</h3>
              <p className="text-[12px] text-[#6B7A94] mt-0.5">{filteredStrategies.length} استراتژی</p>
            </div>
          </div>

          {filteredStrategies.length === 0 ? (
            <div className="text-[#9AA8BF] text-sm text-center py-12">
              {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هنوز استراتژی‌ای نساخته‌اید'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStrategies.map((strategy) => {
                const isSelected = selectedStrategy?.id === strategy.id;
                return (
                  <div
                    key={strategy.id}
                    onClick={() => handleSelectStrategy(strategy)}
                    className={`p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#EDF3FF] border-[#3F7CFF] shadow-[0_4px_12px_rgba(63,124,255,0.15)]'
                        : 'bg-white border-[#E5EBF3] hover:border-[#A9C1FA] hover:bg-[#F8FAFF] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-[15px] font-extrabold text-[#1A2B47] flex items-center gap-2">
                          🎯 {strategy.name}
                        </div>
                        {strategy.description && (
                          <div className="text-[12px] text-[#6B7A94] mt-1.5 font-medium">
                            {strategy.description}
                          </div>
                        )}
                        <div className="text-[11px] text-[#9AA8BF] mt-2 font-semibold">
                          {strategy.versions_count} نسخه
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStrategyForm(strategy);
                          }}
                          className="text-[#3F7CFF] hover:bg-[#EDF3FF] p-2 rounded-[8px] text-sm transition-all"
                          title="ویرایش"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStrategy(strategy);
                          }}
                          className="text-[#E45D72] hover:bg-[#FFEDF0] p-2 rounded-[8px] text-sm transition-all"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* لیست نسخه‌ها */}
        <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
          {selectedStrategy ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-[#F1ECFF] flex items-center justify-center text-xl">
                    🔖
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1A2B47]">نسخه‌های «{selectedStrategy.name}»</h3>
                    <p className="text-[12px] text-[#6B7A94] mt-0.5">{versions.length} نسخه</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenVersionForm()}
                  className="text-white px-4 py-2 rounded-[10px] text-[12px] font-extrabold transition-all shadow-[0_4px_12px_rgba(121,89,214,0.3)] hover:shadow-[0_6px_16px_rgba(121,89,214,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #7959D6, #A78BFA)' }}
                >
                  ➕ نسخه جدید
                </button>
              </div>

              {versions.length === 0 ? (
                <div className="text-[#9AA8BF] text-sm text-center py-12">
                  هنوز نسخه‌ای نساخته‌اید
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[14px] p-4 hover:border-[#A9C1FA] hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-[15px] font-extrabold text-[#1A2B47]">
                            {version.version_name}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getStatusStyle(version.status)}`}>
                              {getStatusLabel(version.status)}
                            </span>
                            <span className="text-[11px] text-[#6B7A94] font-semibold">
                              {version.trades_count} معامله
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenVersionForm(version)}
                            className="text-[#3F7CFF] hover:bg-[#EDF3FF] p-2 rounded-[8px] text-sm transition-all"
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version)}
                            disabled={version.trades_count > 0}
                            className="text-[#E45D72] hover:bg-[#FFEDF0] p-2 rounded-[8px] text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={version.trades_count > 0 ? 'این نسخه معامله دارد' : 'حذف'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {version.rules_note && (
                        <div className="text-[12px] text-[#6B7A94] bg-white border border-[#E5EBF3] rounded-[10px] p-3 mt-3 font-medium">
                          📝 {version.rules_note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-[15px] font-bold text-[#1A2B47]">یک استراتژی را از لیست انتخاب کنید</div>
              <div className="text-[12px] text-[#9AA8BF] mt-2">تا نسخه‌های آن را ببینید</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}