import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import {
  getPropFirms,
  createPropFirm,
  getPropAccounts,
  createPropAccount,
  getPropAccountDetail,
  passStage,
  failStage,
  withdrawFromStage,
  getStageTrades,
} from '../api/client';

interface Firm {
  id: number;
  name: string;
}

interface Account {
  id: number;
  account_label: string;
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

  const handlePassStage = async (stageId: number) => {
    if (!confirm('آیا مطمئنید که این مرحله را پاس می‌کنید؟')) return;
    try {
      await passStage(stageId);
      setSuccessMessage('مرحله با موفقیت پاس شد');
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در پاس کردن مرحله');
    }
  };

  const handleFailStage = async (stageId: number) => {
    const reason = prompt('دلیل فیل شدن (max_daily_dd_exceeded, profit_target_not_met, ...):');
    if (!reason) return;
    try {
      await failStage(stageId, reason);
      setSuccessMessage('مرحله فیل شد');
      if (selectedAccount) await loadAccountDetail(selectedAccount.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در فیل کردن مرحله');
    }
  };

  const handleWithdraw = async (stageId: number) => {
    const amountStr = prompt('مبلغ برداشت (دلار):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await withdrawFromStage(stageId, amount);
      setSuccessMessage(`${amount} دلار برداشت شد`);
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
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">هدف سود ($)</label>
              <input
                type="number"
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">DD روزانه ($)</label>
              <input
                type="number"
                value={maxDailyDd}
                onChange={(e) => setMaxDailyDd(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">DD کلی ($)</label>
              <input
                type="number"
                value={maxTotalDd}
                onChange={(e) => setMaxTotalDd(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs block mb-1">حداقل روزها</label>
              <input
                type="number"
                value={minTradingDays}
                onChange={(e) => setMinTradingDays(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              />
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
        <div className="lg:col-span-1">
          <GlassCard>
            <h3 className="text-text-primary font-bold mb-4">
              📋 اکانت‌ها ({accounts.length})
            </h3>
            {accounts.length === 0 ? (
              <div className="text-text-secondary text-sm text-center py-4">
                اکانتی وجود ندارد
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full text-right p-3 rounded-xl transition-all ${
                      selectedAccount?.id === acc.id
                        ? 'bg-accent/20 border border-accent'
                        : 'bg-card border border-card-border hover:border-accent/30'
                    }`}
                  >
                    <div className="text-text-primary font-bold text-sm">{acc.account_label}</div>
                    <div className="text-text-secondary text-xs mt-1">
                      {acc.firm_name} • {acc.stages_count} مرحله
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

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
                          className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-lg text-xs transition-all"
                        >
                          📋 معاملات
                        </button>
                        {stage.status === 'active' && (
                          <>
                            <button
                              onClick={() => handlePassStage(stage.id)}
                              className="bg-profit/20 text-profit hover:bg-profit/30 px-3 py-1 rounded-lg text-xs transition-all"
                            >
                              ✅ پاس
                            </button>
                            <button
                              onClick={() => handleFailStage(stage.id)}
                              className="bg-loss/20 text-loss hover:bg-loss/30 px-3 py-1 rounded-lg text-xs transition-all"
                            >
                              ❌ فیل
                            </button>
                            {stage.stage_type === 'funded_real' && (
                              <button
                                onClick={() => handleWithdraw(stage.id)}
                                className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-lg text-xs transition-all"
                              >
                                💰 برداشت
                              </button>
                            )}
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
    </div>
  );
}