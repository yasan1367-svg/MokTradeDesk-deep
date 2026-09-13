import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import {
  getPersonalAccounts,
  createPersonalAccount,
  getPersonalAccountDetail,
  deletePersonalAccount,
  getLedger,
  createLedgerTransaction,
  deleteLedgerTransaction,
  getCashflow,
  getPropAccountsForLedger,
} from '../api/client';
import PersianDateInput from '../components/PersianDateInput';

interface Account {
  id: number;
  name: string;
  broker_name: string;
  account_number: string | null;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: number;
  trades_count: number;
}

const TRANSACTION_TYPES = [
  { value: 'deposit', label: '💰 واریز' },
  { value: 'withdrawal', label: '💸 برداشت' },
  { value: 'trade_pnl', label: '📊 سود/زیان معامله' },
  { value: 'prop_payout', label: '🏢 برداشت پراپ' },
  { value: 'challenge_fee', label: '🎫 هزینه‌ی چالش' },
  { value: 'expense', label: '💳 هزینه' },
  { value: 'manual_adjustment', label: '⚙️ تنظیم دستی' },
];

export default function PersonalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [propAccounts, setPropAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountDetail, setAccountDetail] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashflow, setCashflow] = useState<any>(null);

  const [filterAccount, setFilterAccount] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // فرم اکانت
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('0');

  // فرم تراکنش
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [txType, setTxType] = useState('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txAccountId, setTxAccountId] = useState<number | null>(null);
  const [txPropAccountId, setTxPropAccountId] = useState<number | null>(null);
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  const [activeTab, setActiveTab] = useState<'accounts' | 'ledger' | 'cashflow'>('accounts');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ═════════════════════════════════════════════
  // Load Functions
  // ═════════════════════════════════════════════
  const loadAccounts = async () => {
    try {
      const res = await getPersonalAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const loadPropAccounts = async () => {
    try {
      const res = await getPropAccountsForLedger();
      setPropAccounts(res.data);
    } catch (err) {
      console.error('خطا در بارگذاری اکانت‌های پراپ:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await getLedger({
        personal_account_id: filterAccount || undefined,
        transaction_type: filterType || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  const loadCashflow = async () => {
    try {
      const res = await getCashflow({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setCashflow(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadPropAccounts();
    loadTransactions();
    loadCashflow();
  }, []);

  useEffect(() => {
    if (activeTab === 'ledger') loadTransactions();
    if (activeTab === 'cashflow') loadCashflow();
  }, [filterAccount, filterType, fromDate, toDate, activeTab]);

  const handleSelectAccount = async (account: Account) => {
    setSelectedAccount(account);
    try {
      const res = await getPersonalAccountDetail(account.id);
      setAccountDetail(res.data);
    } catch (err) {
      console.error('خطا:', err);
    }
  };

  // ═════════════════════════════════════════════
  // Handlers
  // ═════════════════════════════════════════════
  const handleCreateAccount = async () => {
    if (!accountName.trim() || !brokerName.trim()) {
      setError('نام اکانت و نام بروکر الزامی است');
      return;
    }
    try {
      await createPersonalAccount({
        name: accountName,
        broker_name: brokerName,
        account_number: accountNumber,
        currency: currency,
        initial_balance: parseFloat(initialBalance) || 0,
      });
      setSuccessMessage('اکانت شخصی ساخته شد');
      setShowAccountForm(false);
      setAccountName('');
      setBrokerName('');
      setAccountNumber('');
      setInitialBalance('0');
      await loadAccounts();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا');
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`حذف «${account.name}»؟`)) return;
    try {
      await deletePersonalAccount(account.id);
      setSuccessMessage('اکانت حذف شد');
      if (selectedAccount?.id === account.id) {
        setSelectedAccount(null);
        setAccountDetail(null);
      }
      await loadAccounts();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا');
    }
  };

  const handleCreateTransaction = async () => {
    if (!txAmount || parseFloat(txAmount) === 0) {
      setError('مبلغ الزامی است');
      return;
    }
    try {
      await createLedgerTransaction({
        transaction_type: txType,
        amount: parseFloat(txAmount),
        description: txDescription,
        personal_account_id: txAccountId || undefined,
        prop_account_id: txPropAccountId || undefined,
        transaction_date: txDate ? `${txDate}T00:00:00` : undefined,
      });
      setSuccessMessage('تراکنش ثبت شد');
      setShowTransactionForm(false);
      setTxAmount('');
      setTxDescription('');
      setTxAccountId(null);
      setTxPropAccountId(null);
      await loadAccounts();
      await loadTransactions();
      await loadCashflow();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('حذف تراکنش؟')) return;
    try {
      await deleteLedgerTransaction(id);
      setSuccessMessage('تراکنش حذف شد');
      await loadAccounts();
      await loadTransactions();
      await loadCashflow();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا');
    }
  };

  const getTypeLabel = (type: string) => {
    const found = TRANSACTION_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTypeColor = (amount: number) => {
    return amount >= 0 ? 'text-profit' : 'text-loss';
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

      {/* تب‌ها */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'accounts', label: '🏦 اکانت‌های شخصی' },
          { key: 'ledger', label: '📒 دفتر کل' },
          { key: 'cashflow', label: '💵 جریان نقدی' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2 rounded-xl transition-all ${
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'glass-card text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════
          تب اکانت‌ها
      ═════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="bg-accent hover:bg-accent/80 text-white px-5 py-2 rounded-xl"
            >
              ➕ اکانت جدید
            </button>
          </div>

          {showAccountForm && (
            <GlassCard className="mb-6">
              <h3 className="text-text-primary font-bold mb-4">➕ اکانت شخصی جدید</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-text-secondary text-xs block mb-1">نام اکانت *</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="مثلاً اکانت اصلی آلپاری"
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">نام بروکر *</label>
                  <input
                    type="text"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    placeholder="مثلاً Alpari"
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">شماره اکانت</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">ارز</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">موجودی اولیه</label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAccount}
                  className="bg-profit hover:bg-profit/80 text-white px-6 py-2 rounded-xl"
                >
                  💾 ذخیره
                </button>
                <button
                  onClick={() => setShowAccountForm(false)}
                  className="bg-card-border hover:bg-card-border/80 text-text-secondary px-6 py-2 rounded-xl"
                >
                  ✕ لغو
                </button>
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <GlassCard>
                <h3 className="text-text-primary font-bold mb-4">
                  🏦 اکانت‌ها ({accounts.length})
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
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-text-primary font-bold text-sm">{acc.name}</div>
                            <div className="text-text-secondary text-xs mt-1">
                              {acc.broker_name} • {acc.trades_count} معامله
                            </div>
                          </div>
                          <div className={`text-sm font-bold ${acc.current_balance >= 0 ? 'text-profit' : 'text-loss'}`}>
                            ${acc.current_balance}
                          </div>
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-text-primary font-bold">
                      🔍 {accountDetail.name} — {accountDetail.broker_name}
                    </h3>
                    <button
                      onClick={() => handleDeleteAccount(selectedAccount!)}
                      className="bg-loss/20 text-loss hover:bg-loss/30 px-3 py-1 rounded-lg text-xs"
                    >
                      🗑️ حذف
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                    <div className="bg-card border border-card-border rounded-xl p-3">
                      <div className="text-text-secondary text-xs">موجودی اولیه</div>
                      <div className="text-text-primary font-bold">${accountDetail.initial_balance}</div>
                    </div>
                    <div className="bg-card border border-card-border rounded-xl p-3">
                      <div className="text-text-secondary text-xs">موجودی فعلی</div>
                      <div className={`font-bold ${accountDetail.current_balance >= 0 ? 'text-profit' : 'text-loss'}`}>
                        ${accountDetail.current_balance}
                      </div>
                    </div>
                    <div className="bg-card border border-card-border rounded-xl p-3">
                      <div className="text-text-secondary text-xs">ارز</div>
                      <div className="text-text-primary font-bold">{accountDetail.currency}</div>
                    </div>
                  </div>

                  <h4 className="text-text-primary font-bold mb-3">📒 آخرین تراکنش‌ها</h4>
                  {accountDetail.transactions && accountDetail.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {accountDetail.transactions.slice(0, 10).map((t: any) => (
                        <div
                          key={t.id}
                          className="bg-card border border-card-border rounded-lg p-3 flex justify-between items-center"
                        >
                          <div>
                            <div className="text-text-primary text-sm">{getTypeLabel(t.transaction_type)}</div>
                            {t.description && (
                              <div className="text-text-secondary text-xs mt-1">{t.description}</div>
                            )}
                          </div>
                          <div className={`font-bold ${getTypeColor(t.amount)}`}>
                            {t.amount >= 0 ? '+' : ''}{t.amount} $
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-text-secondary text-sm text-center py-4">
                      تراکنشی ثبت نشده
                    </div>
                  )}
                </GlassCard>
              ) : (
                <GlassCard>
                  <div className="text-center py-12 text-text-secondary">
                    <div className="text-4xl mb-4">🏦</div>
                    <div>یک اکانت را انتخاب کنید</div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════
          تب دفتر کل
      ═════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="bg-accent hover:bg-accent/80 text-white px-5 py-2 rounded-xl"
            >
              ➕ تراکنش جدید
            </button>
          </div>

          {showTransactionForm && (
            <GlassCard className="mb-6">
              <h3 className="text-text-primary font-bold mb-4">➕ تراکنش جدید</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-text-secondary text-xs block mb-1">نوع تراکنش *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">مبلغ *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="مثبت برای واریز، منفی برای برداشت"
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">اکانت شخصی</label>
                  <select
                    value={txAccountId || ''}
                    onChange={(e) => setTxAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  >
                    <option value="">— بدون اکانت شخصی —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>🏦 {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">اکانت پراپ</label>
                  <select
                    value={txPropAccountId || ''}
                    onChange={(e) => setTxPropAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  >
                    <option value="">— بدون پراپ —</option>
                    {propAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.display_name}</option>
                    ))}
                  </select>
                </div>
                <PersianDateInput
  label="تاریخ"
  value={txDate}
  onChange={(date) => setTxDate(date)}
/>
                <div>
                  <label className="text-text-secondary text-xs block mb-1">توضیحات</label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2 text-text-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTransaction}
                  className="bg-profit hover:bg-profit/80 text-white px-6 py-2 rounded-xl"
                >
                  💾 ذخیره
                </button>
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="bg-card-border hover:bg-card-border/80 text-text-secondary px-6 py-2 rounded-xl"
                >
                  ✕ لغو
                </button>
              </div>
            </GlassCard>
          )}

          <GlassCard className="mb-6">
            <h3 className="text-text-primary font-bold mb-4">🔍 فیلترها</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-text-secondary text-xs block mb-1">اکانت</label>
                <select
                  value={filterAccount || ''}
                  onChange={(e) => setFilterAccount(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary text-sm"
                >
                  <option value="">همه</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-text-secondary text-xs block mb-1">نوع</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-text-primary text-sm"
                >
                  <option value="">همه</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <PersianDateInput
  label="از تاریخ"
  value={fromDate}
  onChange={(date) => setFromDate(date)}
/>
<PersianDateInput
  label="تا تاریخ"
  value={toDate}
  onChange={(date) => setToDate(date)}
/>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-text-primary font-bold mb-4">
              📒 تراکنش‌ها ({transactions.length})
            </h3>

            {transactions.length === 0 ? (
              <div className="text-text-secondary text-center py-8">تراکنشی یافت نشد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary border-b border-card-border">
                      <th className="text-right py-2">#</th>
                      <th className="text-right py-2">نوع</th>
                      <th className="text-right py-2">مبلغ</th>
                      <th className="text-right py-2">اکانت</th>
                      <th className="text-right py-2">توضیحات</th>
                      <th className="text-right py-2">تاریخ</th>
                      <th className="text-right py-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-card-border/50">
                        <td className="py-2 text-text-secondary text-xs">{t.id}</td>
                        <td className="py-2 text-text-primary">{getTypeLabel(t.transaction_type)}</td>
                        <td className={`py-2 font-bold ${getTypeColor(t.amount)}`}>
                          {t.amount >= 0 ? '+' : ''}{t.amount} $
                        </td>
                        <td className="py-2 text-text-secondary text-xs">
                          {t.personal_account_id ? '🏦 شخصی' : t.prop_account_id ? '🏢 پراپ' : '—'}
                        </td>
                        <td className="py-2 text-text-secondary text-xs">{t.description || '-'}</td>
                        <td className="py-2 text-text-secondary text-xs">
                          {new Date(t.transaction_date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-loss hover:bg-loss/20 px-2 py-1 rounded-lg text-xs"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* ═════════════════════════════════════════════
          تب جریان نقدی
      ═════════════════════════════════════════════ */}
      {activeTab === 'cashflow' && cashflow && (
        <>
          <GlassCard className="mb-6">
            <h3 className="text-text-primary font-bold mb-4">🔍 فیلتر تاریخ</h3>
            <div className="grid grid-cols-2 gap-3">
              <PersianDateInput
  label="از تاریخ"
  value={fromDate}
  onChange={(date) => setFromDate(date)}
/>
<PersianDateInput
  label="تا تاریخ"
  value={toDate}
  onChange={(date) => setToDate(date)}
/>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <GlassCard>
              <div className="text-text-secondary text-sm mb-1">📥 کل ورودی</div>
              <div className="text-3xl font-bold text-profit">+${cashflow.total_in}</div>
            </GlassCard>
            <GlassCard>
              <div className="text-text-secondary text-sm mb-1">📤 کل خروجی</div>
              <div className="text-3xl font-bold text-loss">-${cashflow.total_out}</div>
            </GlassCard>
            <GlassCard>
              <div className="text-text-secondary text-sm mb-1">💵 خالص</div>
              <div className={`text-3xl font-bold ${cashflow.net >= 0 ? 'text-profit' : 'text-loss'}`}>
                {cashflow.net >= 0 ? '+' : ''}${cashflow.net}
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="text-text-primary font-bold mb-4">📊 تفکیک بر اساس نوع</h3>
            {Object.keys(cashflow.by_type).length === 0 ? (
              <div className="text-text-secondary text-center py-4">تراکنشی وجود ندارد</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(cashflow.by_type).map(([type, data]: [string, any]) => (
                  <div
                    key={type}
                    className="bg-card border border-card-border rounded-xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-text-primary text-sm font-bold">{getTypeLabel(type)}</div>
                      <div className="text-text-secondary text-xs">{data.count} تراکنش</div>
                    </div>
                    <div className={`font-bold ${getTypeColor(data.total)}`}>
                      {data.total >= 0 ? '+' : ''}${data.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}