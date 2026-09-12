import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import {
  getPropFirms,
  createPropFirm,
  getPropAccounts,
  createPropAccount,
  getPropAccountDetail,
  failStage,
  withdrawFromStage,
  getStageTrades,
  checkPassReady,
  passStageWithRules,
  updateStageRules,
} from '../api/client';

interface Firm {
  id: number;
  name: string;
  accounts_count?: number;
}

interface Account {
  id: number;
  account_label: string;
  firm_id: number;
  firm_name: string;
  currency: string;
  stages_count: number;
}

interface Stage {
  id: number;
  stage_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  profit_target: number | null;
  max_daily_dd: number | null;
  max_total_dd: number | null;
  min_trading_days: number | null;
  initial_balance: number | null;
  final_balance: number | null;
  current_profit: number;
  total_withdrawn: number;
  profit_share_percentage: number | null;
  failure_reason: string | null;
  failure_details: string | null;
}

export default function PropPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountDetail, setAccountDetail] = useState<any>(null);
  const [expandedFirms, setExpandedFirms] = useState<number[]>([]);

  const [showFirmForm, setShowFirmForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [selectedFirmId, setSelectedFirmId] = useState<number | null>(null);
  const [accountLabel, setAccountLabel] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // مقادیر دلاری
  const [initialBalance, setInitialBalance] = useState('10000');
  const [profitTarget, setProfitTarget] = useState('800');
  const [maxDailyDd, setMaxDailyDd] = useState('500');
  const [maxTotalDd, setMaxTotalDd] = useState('1000');
  const [minTradingDays, setMinTradingDays] = useState('5');

  // معاملات مرحله
  const [stageTrades, setStageTrades] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  // مودال بررسی و پاس
  const [showPassModal, setShowPassModal] = useState(false);
  const [passingStage, setPassingStage] = useState<Stage | null>(null);
  const [passProgress, setPassProgress] = useState<any>(null);
  const [nextStageRules, setNextStageRules] = useState({
    profit_target: '',
    max_daily_dd: '',
    max_total_dd: '',
    min_trading_days: '',
    initial_balance: '',
    profit_share_percentage: '',
  });

  // ویرایش قوانین
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [editRules, setEditRules] = useState({
    profit_target: '',
    max_daily_dd: '',
    max_total_dd: '',
    min_trading_days: '',
    initial_balance: '',
    profit_share_percentage: '',
  });

  // مودال فیل
  const [showFailModal, setShowFailModal] = useState(false);
  const [failingStage, setFailingStage] = useState<Stage | null>(null);
  const [failReason, setFailReason] = useState('max_daily_dd_exceeded');
  const [failDetails, setFailDetails] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [firmsRes, accountsRes] = await Promise.all([
        getPropFirms(),
        getPropAccounts(),
      ]);
      setFirms(firmsRes.data);
      setAccounts(accountsRes.data);
      const firmIds = firmsRes.data.map((f: Firm) => f.id);
      setExpandedFirms(firmIds);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const loadAccountDetail = async (accountId: number) => {
    try {
      const res = await getPropAccountDetail(accountId);
      setAccountDetail(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const loadStageTrades = async (stageId: number) => {
    try {
      const res = await getStageTrades(stageId);
      setStageTrades(res.data);
      setSelectedStage(stageId);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    loadAccountDetail(account.id);
  };

  const toggleFirm = (firmId: number) => {
    if (expandedFirms.includes(firmId)) {
      setExpandedFirms(expandedFirms.filter((id) => id !== firmId));
    } else {
      setExpandedFirms([...expandedFirms, firmId]);
    }
  };

  const handleCreateFirm = async () => {
    if (!firmName.trim()) return;
    try {
      await createPropFirm({ name: firmName, default_profit_share: 80 });
      setFirmName('');
      setShowFirmForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ساخت شرکت');
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedFirmId || !accountLabel.trim()) return;
    try {
      await createPropAccount({
        prop_firm_id: selectedFirmId,
        account_label: accountLabel,
        account_number: accountNumber,
        initial_balance: parseFloat(initialBalance) || 10000,
        profit_target: parseFloat(profitTarget) || 800,
        max_daily_dd: parseFloat(maxDailyDd) || 500,
        max_total_dd: parseFloat(maxTotalDd) || 1000,
        min_trading_days: parseInt(minTradingDays) || 5,
      });
      setAccountLabel('');
      setAccountNumber('');
      setShowAccountForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ساخت اکانت');
    }
  };

  // ═════════════════════════════════════════════
  // Pass Modal
  // ═════════════════════════════════════════════
  const handleOpenPassModal = async (stage: Stage) => {
    try {
      const res = await checkPassReady(stage.id);
      setPassProgress(res.data);
      setPassingStage(stage);
      setNextStageRules({
        profit_target: '',
        max_daily_dd: '',
        max_total_dd: '',
        min_trading_days: '',
        initial_balance: (stage.final_balance || stage.initial_balance || 10000).toString(),
        profit_share_percentage: stage.stage_type === 'stage_2' ? '80' : '',
      });
      setShowPassModal(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در بررسی مرحله');
    }
  };

  const handleConfirmPass = async () => {
    if (!passingStage || !passProgress) return;
    try {
      const finalBalance = (passingStage.initial_balance || 0) + (passProgress.current_profit || 0);
      await passStageWithRules(
        passingStage.id,
        finalBalance,
        {
          profit_target: nextStageRules.profit_target ? parseFloat(nextStageRules.profit_target) : undefined,
          max_daily_dd: nextStageRules.max_daily_dd ? parseFloat(nextStageRules.max_daily_dd) : undefined,
          max_total_dd: nextStageRules.max_total_dd ? parseFloat(nextStageRules.max_total_dd) : undefined,
          min_trading_days: nextStageRules.min_trading_days ? parseInt(nextStageRules.min_trading_days) : undefined,
          initial_balance: nextStageRules.initial_balance ? parseFloat(nextStageRules.initial_balance) : undefined,
          profit_share_percentage: nextStageRules.profit_share_percentage ? parseFloat(nextStageRules.profit_share_percentage) : undefined,
        }
      );
      setSuccessMessage('مرحله با موفقیت پاس شد. مرحله‌ی بعدی ایجاد شد.');
      setShowPassModal(false);
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در پاس کردن');
    }
  };

  // ═════════════════════════════════════════════
  // Fail Modal
  // ═════════════════════════════════════════════
  const handleOpenFailModal = (stage: Stage) => {
    setFailingStage(stage);
    setFailReason('max_daily_dd_exceeded');
    setFailDetails('');
    setShowFailModal(true);
  };

  const handleConfirmFail = async () => {
    if (!failingStage) return;
    try {
      await failStage(failingStage.id, failReason, failDetails);
      setSuccessMessage('مرحله فیل شد');
      setShowFailModal(false);
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در فیل کردن مرحله');
    }
  };

  // ═════════════════════════════════════════════
  // Edit Rules
  // ═════════════════════════════════════════════
  const startEditStage = (stage: Stage) => {
    setEditingStage(stage.id);
    setEditRules({
      profit_target: stage.profit_target?.toString() || '',
      max_daily_dd: stage.max_daily_dd?.toString() || '',
      max_total_dd: stage.max_total_dd?.toString() || '',
      min_trading_days: stage.min_trading_days?.toString() || '',
      initial_balance: stage.initial_balance?.toString() || '',
      profit_share_percentage: stage.profit_share_percentage?.toString() || '',
    });
  };

  const cancelEditStage = () => {
    setEditingStage(null);
  };

  const handleSaveStageRules = async (stageId: number) => {
    try {
      await updateStageRules(stageId, {
        profit_target: editRules.profit_target ? parseFloat(editRules.profit_target) : undefined,
        max_daily_dd: editRules.max_daily_dd ? parseFloat(editRules.max_daily_dd) : undefined,
        max_total_dd: editRules.max_total_dd ? parseFloat(editRules.max_total_dd) : undefined,
        min_trading_days: editRules.min_trading_days ? parseInt(editRules.min_trading_days) : undefined,
        initial_balance: editRules.initial_balance ? parseFloat(editRules.initial_balance) : undefined,
        profit_share_percentage: editRules.profit_share_percentage ? parseFloat(editRules.profit_share_percentage) : undefined,
      });
      setSuccessMessage('قوانین مرحله ذخیره شد');
      setEditingStage(null);
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ذخیره قوانین');
    }
  };

  // ═════════════════════════════════════════════
  // Withdraw
  // ═════════════════════════════════════════════
  const handleWithdraw = async (stageId: number) => {
    const amountStr = prompt('مبلغ برداشت (دلار):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await withdrawFromStage(stageId, amount);
      setSuccessMessage(`${amount} دلار برداشت شد و به درآمد اضافه شد`);
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در برداشت');
    }
  };

  const getStageTypeLabel = (type: string) => {
    if (type === 'stage_1') return '🥇 مرحله ۱';
    if (type === 'stage_2') return '🥈 مرحله ۲';
    if (type === 'funded_real') return '💰 رییل';
    return type;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-accent/20 text-accent',
      passed: 'bg-profit/20 text-profit',
      failed: 'bg-loss/20 text-loss',
      closed: 'bg-text-secondary/20 text-text-secondary',
    };
    const labels: Record<string, string> = {
      active: 'فعال',
      passed: 'پاس‌شده',
      failed: 'فیل‌شده',
      closed: 'بسته‌شده',
    };
    return (
      <span className={`text-xs px-3 py-1 rounded-full ${colors[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

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

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowFirmForm(!showFirmForm)}
          className="bg-accent hover:bg-accent/80 text-white px-5 py-2 rounded-xl transition-all"
        >
          ➕ شرکت پراپ جدید
        </button>
        <button
          onClick={() => setShowAccountForm(!showAccountForm)}
          disabled={firms.length === 0}
          className="bg-accent hover:bg-accent/80 text-white px-5 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          ➕ اکانت پراپ جدید
        </button>
      </div>

      {showFirmForm && (
        <GlassCard className="mb-6">
          <h3 className="text-text-primary font-bold mb-4">➕ شرکت پراپ جدید</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="نام شرکت (مثلاً FTMO)"
              className="flex-1 bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleCreateFirm}
              className="bg-profit hover:bg-profit/80 text-white px-6 py-3 rounded-xl transition-all"
            >
              ذخیره
            </button>
          </div>
        </GlassCard>
      )}

      {showAccountForm && (
        <GlassCard className="mb-6">
          <h3 className="text-text-primary font-bold mb-4">➕ اکانت پراپ جدید</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select
              value={selectedFirmId || ''}
              onChange={(e) => setSelectedFirmId(Number(e.target.value))}
              className="bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">— انتخاب شرکت —</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder="برچسب اکانت"
              className="bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="شماره اکانت (اختیاری)"
              className="bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="text-text-secondary text-xs block mb-1">موجودی اولیه ($)</label>
              <input type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary" />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">هدف سود ($)</label>
              <input type="number" value={profitTarget} onChange={(e) => setProfitTarget(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary" />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">DD روزانه ($)</label>
              <input type="number" value={maxDailyDd} onChange={(e) => setMaxDailyDd(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary" />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">DD کلی ($)</label>
              <input type="number" value={maxTotalDd} onChange={(e) => setMaxTotalDd(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary" />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">حداقل روزها</label>
              <input type="number" value={minTradingDays} onChange={(e) => setMinTradingDays(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary" />
            </div>
          </div>

          <button
            onClick={handleCreateAccount}
            className="bg-profit hover:bg-profit/80 text-white px-6 py-3 rounded-xl transition-all"
          >
            ذخیره اکانت
          </button>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نمای درختی شرکت‌ها */}
        <div className="lg:col-span-1">
          <GlassCard>
            <h3 className="text-text-primary font-bold mb-4">
              🏢 شرکت‌های پراپ ({firms.length})
            </h3>

            {firms.length === 0 ? (
              <div className="text-text-secondary text-sm text-center py-4">شرکتی وجود ندارد</div>
            ) : (
              <div className="space-y-2">
                {firms.map((firm) => {
                  const firmAccounts = accounts.filter((a) => a.firm_id === firm.id);
                  const isExpanded = expandedFirms.includes(firm.id);

                  return (
                    <div key={firm.id}>
                      <button
                        onClick={() => toggleFirm(firm.id)}
                        className="w-full text-right p-3 rounded-xl bg-card border border-card-border hover:border-accent/30 transition-all flex justify-between items-center"
                      >
                        <span className="text-text-primary font-bold text-sm">🏢 {firm.name}</span>
                        <span className="text-text-secondary text-xs">
                          {firmAccounts.length} اکانت {isExpanded ? '▼' : '◀'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-1 mr-4 space-y-1">
                          {firmAccounts.length === 0 ? (
                            <div className="text-text-secondary text-xs py-2 pr-3">اکانتی ندارد</div>
                          ) : (
                            firmAccounts.map((acc) => (
                              <button
                                key={acc.id}
                                onClick={() => handleSelectAccount(acc)}
                                className={`w-full text-right p-2 rounded-lg transition-all text-sm ${
                                  selectedAccount?.id === acc.id
                                    ? 'bg-accent/20 border border-accent'
                                    : 'bg-card/50 border border-card-border/50 hover:border-accent/30'
                                }`}
                              >
                                <div className="text-text-primary text-xs">📁 {acc.account_label}</div>
                                <div className="text-text-secondary text-xs mt-0.5">{acc.stages_count} مرحله</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* جزئیات اکانت */}
        <div className="lg:col-span-2">
          {accountDetail ? (
            <GlassCard>
              <h3 className="text-text-primary font-bold mb-4">
                🔍 {accountDetail.account_label} — {accountDetail.firm_name}
              </h3>

              <div className="space-y-4">
                {accountDetail.stages.map((stage: Stage) => (
                  <div key={stage.id} className="bg-card border border-card-border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-text-primary font-bold">
                          {getStageTypeLabel(stage.stage_type)}
                        </span>
                        {getStatusBadge(stage.status)}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => loadStageTrades(stage.id)}
                          className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-lg text-xs"
                        >
                          📋 معاملات
                        </button>
                        <button
                          onClick={() => startEditStage(stage)}
                          className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-lg text-xs"
                        >
                          ✏️ ویرایش قوانین
                        </button>
                        {stage.status === 'active' && stage.stage_type !== 'funded_real' && (
                          <>
                            <button
                              onClick={() => handleOpenPassModal(stage)}
                              className="bg-profit/20 text-profit hover:bg-profit/30 px-3 py-1 rounded-lg text-xs"
                            >
                              ✅ بررسی و پاس
                            </button>
                            <button
                              onClick={() => handleOpenFailModal(stage)}
                              className="bg-loss/20 text-loss hover:bg-loss/30 px-3 py-1 rounded-lg text-xs"
                            >
                              ❌ فیل
                            </button>
                          </>
                        )}
                        {stage.status === 'active' && stage.stage_type === 'funded_real' && (
                          <>
                            <button
                              onClick={() => handleWithdraw(stage.id)}
                              className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-lg text-xs"
                            >
                              💰 برداشت
                            </button>
                            <button
                              onClick={() => handleOpenFailModal(stage)}
                              className="bg-loss/20 text-loss hover:bg-loss/30 px-3 py-1 rounded-lg text-xs"
                            >
                              ❌ فیل
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {stage.initial_balance !== null && (
                        <div>
                          <div className="text-text-secondary text-xs">موجودی اولیه</div>
                          <div className="text-text-primary font-bold">${stage.initial_balance}</div>
                        </div>
                      )}
                      {stage.profit_target !== null && (
                        <div>
                          <div className="text-text-secondary text-xs">هدف سود</div>
                          <div className="text-profit font-bold">${stage.profit_target}</div>
                        </div>
                      )}
                      {stage.max_daily_dd !== null && (
                        <div>
                          <div className="text-text-secondary text-xs">DD روزانه</div>
                          <div className="text-loss font-bold">${stage.max_daily_dd}</div>
                        </div>
                      )}
                      {stage.max_total_dd !== null && (
                        <div>
                          <div className="text-text-secondary text-xs">DD کلی</div>
                          <div className="text-loss font-bold">${stage.max_total_dd}</div>
                        </div>
                      )}
                      {stage.final_balance !== null && (
                        <div>
                          <div className="text-text-secondary text-xs">موجودی نهایی</div>
                          <div className="text-text-primary font-bold">${stage.final_balance}</div>
                        </div>
                      )}
                      {stage.stage_type === 'funded_real' && (
                        <>
                          <div>
                            <div className="text-text-secondary text-xs">سود جاری</div>
                            <div className={`font-bold ${stage.current_profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                              ${stage.current_profit?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-text-secondary text-xs">کل برداشت</div>
                            <div className="text-accent font-bold">${stage.total_withdrawn?.toFixed(2)}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {stage.failure_reason && (
                      <div className="mt-3 bg-loss/10 border border-loss/30 text-loss p-2 rounded-lg text-xs">
                        دلیل فیل شدن: {stage.failure_reason}
                        {stage.failure_details && ` — ${stage.failure_details}`}
                      </div>
                    )}

                    {/* فرم ویرایش قوانین */}
                    {editingStage === stage.id && (
                      <div className="mt-4 bg-accent/5 border border-accent/30 rounded-xl p-4">
                        <h4 className="text-text-primary font-bold text-sm mb-3">✏️ ویرایش قوانین مرحله</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-text-secondary text-xs block mb-1">هدف سود ($)</label>
                            <input type="number" value={editRules.profit_target}
                              onChange={(e) => setEditRules({ ...editRules, profit_target: e.target.value })}
                              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                          </div>
                          <div>
                            <label className="text-text-secondary text-xs block mb-1">DD روزانه ($)</label>
                            <input type="number" value={editRules.max_daily_dd}
                              onChange={(e) => setEditRules({ ...editRules, max_daily_dd: e.target.value })}
                              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                          </div>
                          <div>
                            <label className="text-text-secondary text-xs block mb-1">DD کلی ($)</label>
                            <input type="number" value={editRules.max_total_dd}
                              onChange={(e) => setEditRules({ ...editRules, max_total_dd: e.target.value })}
                              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                          </div>
                          <div>
                            <label className="text-text-secondary text-xs block mb-1">حداقل روزها</label>
                            <input type="number" value={editRules.min_trading_days}
                              onChange={(e) => setEditRules({ ...editRules, min_trading_days: e.target.value })}
                              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                          </div>
                          <div>
                            <label className="text-text-secondary text-xs block mb-1">موجودی اولیه ($)</label>
                            <input type="number" value={editRules.initial_balance}
                              onChange={(e) => setEditRules({ ...editRules, initial_balance: e.target.value })}
                              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                          </div>
                          {stage.stage_type === 'funded_real' && (
                            <div>
                              <label className="text-text-secondary text-xs block mb-1">درصد سهم کاربر</label>
                              <input type="number" value={editRules.profit_share_percentage}
                                onChange={(e) => setEditRules({ ...editRules, profit_share_percentage: e.target.value })}
                                className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveStageRules(stage.id)}
                            className="bg-profit hover:bg-profit/80 text-white px-4 py-2 rounded-lg text-xs">
                            💾 ذخیره
                          </button>
                          <button onClick={cancelEditStage}
                            className="bg-card-border hover:bg-card-border/80 text-text-secondary px-4 py-2 rounded-lg text-xs">
                            ✕ لغو
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard>
              <div className="text-center py-12 text-text-secondary">
                <div className="text-4xl mb-4">🏢</div>
                <div>یک اکانت را از لیست انتخاب کنید</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* معاملات مرحله */}
      {selectedStage && stageTrades.length > 0 && (
        <GlassCard className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-text-primary font-bold">
              📋 معاملات مرحله ({stageTrades.length})
            </h3>
            <button
              onClick={() => { setSelectedStage(null); setStageTrades([]); }}
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              ✕ بستن
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary border-b border-card-border">
                  <th className="text-right py-2">#</th>
                  <th className="text-right py-2">نماد</th>
                  <th className="text-right py-2">جهت</th>
                  <th className="text-right py-2">حجم</th>
                  <th className="text-right py-2">سود/زیان</th>
                  <th className="text-right py-2">تاریخ بسته</th>
                </tr>
              </thead>
              <tbody>
                {stageTrades.map((t, idx) => (
                  <tr key={t.id} className="border-b border-card-border/50 hover:bg-card/50">
                    <td className="py-2 text-text-secondary">{idx + 1}</td>
                    <td className="py-2 text-text-primary font-bold">{t.symbol}</td>
                    <td className={`py-2 ${t.direction === 'buy' ? 'text-profit' : 'text-loss'}`}>
                      {t.direction === 'buy' ? 'خرید' : 'فروش'}
                    </td>
                    <td className="py-2 text-text-primary">{t.size}</td>
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
        </GlassCard>
      )}

      {/* مودال بررسی و پاس */}
      {showPassModal && passingStage && passProgress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-text-primary">
                📊 بررسی مرحله {passingStage.stage_type === 'stage_1' ? 'اول' : 'دوم'}
              </h3>
              <button onClick={() => setShowPassModal(false)}
                className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className={`p-4 rounded-xl mb-5 ${
              passProgress.suggested_status === 'ready_to_pass'
                ? 'bg-profit/10 border border-profit/30'
                : passProgress.suggested_status === 'failed_daily_dd' || passProgress.suggested_status === 'failed_total_dd'
                ? 'bg-loss/10 border border-loss/30'
                : 'bg-accent/10 border border-accent/30'
            }`}>
              <div className="font-bold text-lg mb-2">
                {passProgress.suggested_status === 'ready_to_pass' && '✅ آماده‌ی پاس کردن'}
                {passProgress.suggested_status === 'failed_daily_dd' && '❌ DD روزانه نقض شده'}
                {passProgress.suggested_status === 'failed_total_dd' && '❌ DD کلی نقض شده'}
                {passProgress.suggested_status === 'in_progress' && '⏳ در حال پیشرفت'}
              </div>
              <div className="text-sm text-text-secondary">
                {passProgress.total_trades} معامله | سود فعلی: {passProgress.current_profit} $
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary text-sm">هدف سود</span>
                  <span className={`font-bold ${passProgress.target_reached ? 'text-profit' : 'text-text-primary'}`}>
                    {passProgress.current_profit_percent}٪ / {passProgress.profit_target_percent}٪
                  </span>
                </div>
                <div className="w-full bg-card-border rounded-full h-2">
                  <div className={`h-2 rounded-full ${passProgress.target_reached ? 'bg-profit' : 'bg-accent'}`}
                    style={{ width: `${Math.min(passProgress.profit_progress_percent, 100)}%` }} />
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary text-sm">DD روزانه</span>
                  <span className={`font-bold ${passProgress.daily_dd_violated ? 'text-loss' : 'text-text-primary'}`}>
                    {passProgress.max_daily_dd_percent}٪ / {passProgress.max_daily_dd_limit}٪
                  </span>
                </div>
                <div className="w-full bg-card-border rounded-full h-2">
                  <div className={`h-2 rounded-full ${passProgress.daily_dd_violated ? 'bg-loss' : 'bg-accent'}`}
                    style={{ width: `${Math.min(passProgress.daily_dd_progress_percent, 100)}%` }} />
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary text-sm">DD کلی</span>
                  <span className={`font-bold ${passProgress.total_dd_violated ? 'text-loss' : 'text-text-primary'}`}>
                    {passProgress.max_total_dd_percent}٪ / {passProgress.max_total_dd_limit}٪
                  </span>
                </div>
                <div className="w-full bg-card-border rounded-full h-2">
                  <div className={`h-2 rounded-full ${passProgress.total_dd_violated ? 'bg-loss' : 'bg-accent'}`}
                    style={{ width: `${Math.min(passProgress.total_dd_progress_percent, 100)}%` }} />
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-xl p-4 flex justify-between">
                <span className="text-text-secondary text-sm">روزهای معاملاتی</span>
                <span className={`font-bold ${passProgress.days_met ? 'text-profit' : 'text-text-primary'}`}>
                  {passProgress.trading_days} / {passProgress.min_trading_days}
                </span>
              </div>
            </div>

            {passProgress.suggested_status !== 'failed_daily_dd' && passProgress.suggested_status !== 'failed_total_dd' && (
              <>
                <h4 className="font-bold text-text-primary mb-3">⚙️ قوانین مرحله‌ی بعدی</h4>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-text-secondary text-xs block mb-1">هدف سود ($)</label>
                    <input type="number" value={nextStageRules.profit_target}
                      onChange={(e) => setNextStageRules({ ...nextStageRules, profit_target: e.target.value })}
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs block mb-1">DD روزانه ($)</label>
                    <input type="number" value={nextStageRules.max_daily_dd}
                      onChange={(e) => setNextStageRules({ ...nextStageRules, max_daily_dd: e.target.value })}
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs block mb-1">DD کلی ($)</label>
                    <input type="number" value={nextStageRules.max_total_dd}
                      onChange={(e) => setNextStageRules({ ...nextStageRules, max_total_dd: e.target.value })}
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs block mb-1">حداقل روزها</label>
                    <input type="number" value={nextStageRules.min_trading_days}
                      onChange={(e) => setNextStageRules({ ...nextStageRules, min_trading_days: e.target.value })}
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs block mb-1">موجودی اولیه ($)</label>
                    <input type="number" value={nextStageRules.initial_balance}
                      onChange={(e) => setNextStageRules({ ...nextStageRules, initial_balance: e.target.value })}
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                  </div>
                  {passingStage.stage_type === 'stage_2' && (
                    <div>
                      <label className="text-text-secondary text-xs block mb-1">درصد سهم کاربر</label>
                      <input type="number" value={nextStageRules.profit_share_percentage}
                        onChange={(e) => setNextStageRules({ ...nextStageRules, profit_share_percentage: e.target.value })}
                        className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-text-primary" />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={handleConfirmPass}
                disabled={passProgress.suggested_status === 'failed_daily_dd' || passProgress.suggested_status === 'failed_total_dd'}
                className="flex-1 bg-profit hover:bg-profit/80 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                ✅ تأیید و پاس
              </button>
              <button onClick={() => setShowPassModal(false)}
                className="flex-1 bg-card-border hover:bg-card-border/80 text-text-secondary py-3 rounded-xl">
                ✕ لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال فیل */}
      {showFailModal && failingStage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-text-primary">
                ❌ فیل کردن مرحله
              </h3>
              <button
                onClick={() => setShowFailModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="text-text-secondary text-sm block mb-2">دلیل فیل شدن</label>
              <select
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="max_daily_dd_exceeded">نقض DD روزانه</option>
                <option value="max_total_dd_exceeded">نقض DD کلی</option>
                <option value="profit_target_not_met">عدم رسیدن به هدف سود</option>
                <option value="min_trading_days_not_met">کمبود روزهای معاملاتی</option>
                <option value="rule_violation">نقض قانون</option>
                <option value="manual">فیل دستی</option>
                <option value="other">سایر</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="text-text-secondary text-sm block mb-2">توضیحات (اختیاری)</label>
              <textarea
                value={failDetails}
                onChange={(e) => setFailDetails(e.target.value)}
                placeholder="توضیحات بیشتر..."
                rows={3}
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmFail}
                className="flex-1 bg-loss hover:bg-loss/80 text-white py-3 rounded-xl font-bold"
              >
                ❌ تأیید فیل
              </button>
              <button
                onClick={() => setShowFailModal(false)}
                className="flex-1 bg-card-border hover:bg-card-border/80 text-text-secondary py-3 rounded-xl"
              >
                ✕ لغو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}