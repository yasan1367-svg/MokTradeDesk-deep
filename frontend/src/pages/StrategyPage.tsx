import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
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

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    research: 'bg-text-secondary/20 text-text-secondary',
    backtest: 'bg-accent/20 text-accent',
    optimization: 'bg-accent/20 text-accent',
    forward: 'bg-accent/20 text-accent',
    approved: 'bg-profit/20 text-profit',
    live: 'bg-profit/20 text-profit',
    deprecated: 'bg-loss/20 text-loss',
    archived: 'bg-text-secondary/20 text-text-secondary',
    rejected: 'bg-loss/20 text-loss',
  };
  return colors[status] || 'bg-text-secondary/20 text-text-secondary';
};

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);

  // فرم استراتژی
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null);
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');

  // فرم نسخه
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionRules, setVersionRules] = useState('');
  const [versionStatus, setVersionStatus] = useState('research');

  // فیلتر
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
    <div>
      {error && (
        <div className="mb-4 bg-loss/10 border border-loss/30 text-loss p-3 rounded-xl">
          ❌ {error}
          <button onClick={() => setError(null)} className="float-left text-xs">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 bg-profit/10 border border-profit/30 text-profit p-3 rounded-xl">
          ✅ {successMessage}
        </div>
      )}

      {/* دکمه‌ها و جستجو */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => handleOpenStrategyForm()}
          className="bg-accent hover:bg-accent/80 text-white px-5 py-2 rounded-xl transition-all"
        >
          ➕ استراتژی جدید
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 جستجوی استراتژی..."
          className="flex-1 min-w-[200px] bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

      {/* فرم استراتژی */}
      {showStrategyForm && (
        <GlassCard className="mb-6">
          <h3 className="text-text-primary font-bold mb-4">
            {editingStrategyId ? '✏️ ویرایش استراتژی' : '➕ استراتژی جدید'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-sm block mb-1">نام استراتژی *</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="مثلاً SP2L"
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-1">توضیحات</label>
              <textarea
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="توضیحات استراتژی..."
                rows={3}
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveStrategy}
              className="bg-profit hover:bg-profit/80 text-white px-6 py-3 rounded-xl transition-all"
            >
              💾 ذخیره
            </button>
            <button
              onClick={() => setShowStrategyForm(false)}
              className="bg-card-border hover:bg-card-border/80 text-text-secondary px-6 py-3 rounded-xl transition-all"
            >
              ✕ لغو
            </button>
          </div>
        </GlassCard>
      )}

      {/* فرم نسخه */}
      {showVersionForm && selectedStrategy && (
        <GlassCard className="mb-6">
          <h3 className="text-text-primary font-bold mb-4">
            {editingVersionId ? '✏️ ویرایش نسخه' : `➕ نسخه‌ی جدید برای «${selectedStrategy.name}»`}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-sm block mb-1">نام نسخه *</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="مثلاً SP2L_TP1.5"
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-1">قوانین / توضیحات</label>
              <textarea
                value={versionRules}
                onChange={(e) => setVersionRules(e.target.value)}
                placeholder="قوانین این نسخه..."
                rows={4}
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none resize-none"
              />
            </div>
            {editingVersionId && (
              <div>
                <label className="text-text-secondary text-sm block mb-1">وضعیت</label>
                <select
                  value={versionStatus}
                  onChange={(e) => setVersionStatus(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveVersion}
              className="bg-profit hover:bg-profit/80 text-white px-6 py-3 rounded-xl transition-all"
            >
              💾 ذخیره
            </button>
            <button
              onClick={() => setShowVersionForm(false)}
              className="bg-card-border hover:bg-card-border/80 text-text-secondary px-6 py-3 rounded-xl transition-all"
            >
              ✕ لغو
            </button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* لیست استراتژی‌ها */}
        <div>
          <GlassCard>
            <h3 className="text-text-primary font-bold mb-4">
              📚 استراتژی‌ها ({filteredStrategies.length})
            </h3>

            {filteredStrategies.length === 0 ? (
              <div className="text-text-secondary text-sm text-center py-8">
                {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هنوز استراتژی‌ای نساخته‌اید'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedStrategy?.id === strategy.id
                        ? 'bg-accent/20 border-accent'
                        : 'bg-card border-card-border hover:border-accent/30'
                    }`}
                    onClick={() => handleSelectStrategy(strategy)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-text-primary font-bold text-sm">
                          🎯 {strategy.name}
                        </div>
                        {strategy.description && (
                          <div className="text-text-secondary text-xs mt-1">
                            {strategy.description}
                          </div>
                        )}
                        <div className="text-text-secondary text-xs mt-1">
                          {strategy.versions_count} نسخه
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStrategyForm(strategy);
                          }}
                          className="text-accent hover:bg-accent/20 p-1.5 rounded-lg text-xs"
                          title="ویرایش"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStrategy(strategy);
                          }}
                          className="text-loss hover:bg-loss/20 p-1.5 rounded-lg text-xs"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* لیست نسخه‌ها */}
        <div>
          {selectedStrategy ? (
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-text-primary font-bold">
                  🔖 نسخه‌های «{selectedStrategy.name}»
                </h3>
                <button
                  onClick={() => handleOpenVersionForm()}
                  className="bg-accent hover:bg-accent/80 text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  ➕ نسخه‌ی جدید
                </button>
              </div>

              {versions.length === 0 ? (
                <div className="text-text-secondary text-sm text-center py-8">
                  هنوز نسخه‌ای نساخته‌اید
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="bg-card border border-card-border rounded-xl p-3 hover:border-accent/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-text-primary font-bold text-sm">
                            {version.version_name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(version.status)}`}>
                              {getStatusLabel(version.status)}
                            </span>
                            <span className="text-text-secondary text-xs">
                              {version.trades_count} معامله
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenVersionForm(version)}
                            className="text-accent hover:bg-accent/20 p-1.5 rounded-lg text-xs"
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version)}
                            disabled={version.trades_count > 0}
                            className="text-loss hover:bg-loss/20 p-1.5 rounded-lg text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                            title={version.trades_count > 0 ? 'این نسخه معامله دارد' : 'حذف'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {version.rules_note && (
                        <div className="text-text-secondary text-xs bg-background/50 rounded-lg p-2 mt-2">
                          {version.rules_note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard>
              <div className="text-center py-12 text-text-secondary">
                <div className="text-4xl mb-4">🎯</div>
                <div>یک استراتژی را از لیست انتخاب کنید</div>
                <div className="text-xs mt-2">تا نسخه‌های آن را ببینید</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}