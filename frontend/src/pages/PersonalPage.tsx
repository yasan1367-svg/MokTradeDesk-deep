import { useState, useEffect } from 'react';
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

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('0');

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
    return amount >= 0 ? 'text-[#13AE81]' : 'text-[#E45D72]';
  };

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

      {/* تب‌ها */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'accounts', label: '🏦 اکانت‌های شخصی', icon: '🏦' },
          { key: 'ledger', label: '📒 دفتر کل', icon: '📒' },
          { key: 'cashflow', label: '💵 جریان نقدی', icon: '💵' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-[12px] text-sm font-extrabold transition-all ${
                isActive
                  ? 'text-white shadow-[0_6px_16px_rgba(63,124,255,0.3)] -translate-y-0.5'
                  : 'bg-white border border-[#E5EBF3] text-[#6B7A94] hover:border-[#A9C1FA] hover:text-[#3F7CFF]'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' } : {}}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════
          تب اکانت‌ها
      ═════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="text-white px-6 py-3 rounded-[12px] text-sm font-extrabold shadow-[0_6px_16px_rgba(63,124,255,0.3)] hover:shadow-[0_10px_24px_rgba(63,124,255,0.4)] hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
            >
              ➕ اکانت جدید
            </button>
          </div>

          {showAccountForm && (
            <div className="bg-white border-2 border-[#3F7CFF] rounded-[22px] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5EBF3]">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}>
                  🏦
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A2B47]">اکانت شخصی جدید</h3>
                  <p className="text-[12px] text-[#6B7A94] mt-0.5">اطلاعات اکانت بروکر را وارد کنید</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                    نام اکانت <span className="text-[#E45D72]">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="مثلاً اکانت اصلی آلپاری"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                    نام بروکر <span className="text-[#E45D72]">*</span>
                  </label>
                  <input
                    type="text"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    placeholder="مثلاً Alpari"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">شماره اکانت</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="اختیاری"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">ارز</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all cursor-pointer"
                  >
                    <option value="USD">USD - دلار</option>
                    <option value="EUR">EUR - یورو</option>
                    <option value="GBP">GBP - پوند</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">موجودی اولیه</label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-5 py-3.5 text-[#1A2B47] text-sm font-bold focus:border-[#3F7CFF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EDF3FF] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5EBF3]">
                <button
                  onClick={handleCreateAccount}
                  className="text-white px-7 py-3 rounded-[12px] text-sm font-extrabold shadow-[0_6px_16px_rgba(19,174,129,0.3)]"
                  style={{ background: 'linear-gradient(135deg, #13AE81, #4DD9A9)' }}
                >
                  💾 ذخیره
                </button>
                <button
                  onClick={() => setShowAccountForm(false)}
                  className="bg-white border-2 border-[#E5EBF3] hover:border-[#A9C1FA] text-[#6B7A94] px-7 py-3 rounded-[12px] text-sm font-bold transition-all"
                >
                  ✕ لغو
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
                  <div className="w-11 h-11 rounded-[14px] bg-[#EDF3FF] flex items-center justify-center text-xl">
                    🏦
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1A2B47]">اکانت‌های شخصی</h3>
                    <p className="text-[12px] text-[#6B7A94] mt-0.5">{accounts.length} اکانت</p>
                  </div>
                </div>

                {accounts.length === 0 ? (
                  <div className="text-[#9AA8BF] text-sm text-center py-8">اکانتی وجود ندارد</div>
                ) : (
                  <div className="space-y-2.5">
                    {accounts.map((acc) => {
                      const isSelected = selectedAccount?.id === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => handleSelectAccount(acc)}
                          className={`w-full text-right p-4 rounded-[14px] border-2 transition-all ${
                            isSelected
                              ? 'bg-[#EDF3FF] border-[#3F7CFF] shadow-[0_4px_12px_rgba(63,124,255,0.15)]'
                              : 'bg-white border-[#E5EBF3] hover:border-[#A9C1FA] hover:bg-[#F8FAFF]'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-[14px] font-extrabold text-[#1A2B47]">{acc.name}</div>
                              <div className="text-[11px] text-[#6B7A94] mt-1 font-semibold">
                                {acc.broker_name} • {acc.trades_count} معامله
                              </div>
                            </div>
                            <div className={`text-[14px] font-extrabold ${acc.current_balance >= 0 ? 'text-[#13AE81]' : 'text-[#E45D72]'}`}>
                              ${acc.current_balance}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {accountDetail ? (
                <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#E5EBF3]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white"
                        style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}>
                        🔍
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#1A2B47]">{accountDetail.name}</h3>
                        <p className="text-[12px] text-[#6B7A94] mt-0.5">{accountDetail.broker_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(selectedAccount!)}
                      className="text-[#E45D72] hover:bg-[#FFEDF0] px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all"
                    >
                      🗑️ حذف
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#F8FAFF] border border-[#E5EBF3] rounded-[14px] p-4">
                      <div className="text-[11px] text-[#6B7A94] font-bold mb-1">موجودی اولیه</div>
                      <div className="text-[18px] font-extrabold text-[#1A2B47]">${accountDetail.initial_balance}</div>
                    </div>
                    <div className="bg-[#E5F8F1] border border-[#A8E6CF] rounded-[14px] p-4">
                      <div className="text-[11px] text-[#6B7A94] font-bold mb-1">موجودی فعلی</div>
                      <div className={`text-[18px] font-extrabold ${accountDetail.current_balance >= 0 ? 'text-[#13AE81]' : 'text-[#E45D72]'}`}>
                        ${accountDetail.current_balance}
                      </div>
                    </div>
                    <div className="bg-[#F8FAFF] border border-[#E5EBF3] rounded-[14px] p-4">
                      <div className="text-[11px] text-[#6B7A94] font-bold mb-1">ارز</div>
                      <div className="text-[18px] font-extrabold text-[#1A2B47]">{accountDetail.currency}</div>
                    </div>
                  </div>

                  <h4 className="text-[14px] font-extrabold text-[#1A2B47] mb-3">📒 آخرین تراکنش‌ها</h4>
                  {accountDetail.transactions && accountDetail.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {accountDetail.transactions.slice(0, 10).map((t: any) => (
                        <div
                          key={t.id}
                          className="bg-[#F8FAFF] border border-[#E5EBF3] rounded-[12px] p-4 flex justify-between items-center hover:border-[#A9C1FA] transition-all"
                        >
                          <div>
                            <div className="text-[13px] font-bold text-[#1A2B47]">{getTypeLabel(t.transaction_type)}</div>
                            {t.description && (
                              <div className="text-[11px] text-[#6B7A94] mt-1">{t.description}</div>
                            )}
                          </div>
                          <div className={`text-[15px] font-extrabold ${getTypeColor(t.amount)}`}>
                            {t.amount >= 0 ? '+' : ''}{t.amount} $
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#9AA8BF] text-sm text-center py-6 bg-[#F8FAFF] rounded-[12px]">
                      تراکنشی ثبت نشده
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-12 shadow-md text-center">
                  <div className="text-6xl mb-4">🏦</div>
                  <div className="text-[15px] font-bold text-[#1A2B47]">یک اکانت را انتخاب کنید</div>
                  <div className="text-[12px] text-[#9AA8BF] mt-2">تا جزئیات آن را ببینید</div>
                </div>
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="text-white px-6 py-3 rounded-[12px] text-sm font-extrabold shadow-[0_6px_16px_rgba(63,124,255,0.3)] hover:shadow-[0_10px_24px_rgba(63,124,255,0.4)] hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
            >
              ➕ تراکنش جدید
            </button>
          </div>

          {showTransactionForm && (
            <div className="bg-white border-2 border-[#3F7CFF] rounded-[22px] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5EBF3]">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}>
                  📒
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A2B47]">تراکنش جدید</h3>
                  <p className="text-[12px] text-[#6B7A94] mt-0.5">اطلاعات تراکنش را وارد کنید</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                    نوع تراکنش <span className="text-[#E45D72]">*</span>
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">
                    مبلغ <span className="text-[#E45D72]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="مثبت برای واریز، منفی برای برداشت"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-bold focus:border-[#3F7CFF] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">اکانت شخصی</label>
                  <select
                    value={txAccountId || ''}
                    onChange={(e) => setTxAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">— بدون اکانت —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>🏦 {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">اکانت پراپ</label>
                  <select
                    value={txPropAccountId || ''}
                    onChange={(e) => setTxPropAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">— بدون پراپ —</option>
                    {propAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.display_name}</option>
                    ))}
                  </select>
                </div>
                <PersianDateInput
                  label="تاریخ *"
                  value={txDate}
                  onChange={(date) => setTxDate(date)}
                />
                <div>
                  <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">توضیحات</label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="اختیاری"
                    className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-medium focus:border-[#3F7CFF] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5EBF3]">
                <button
                  onClick={handleCreateTransaction}
                  className="text-white px-7 py-3 rounded-[12px] text-sm font-extrabold"
                  style={{ background: 'linear-gradient(135deg, #13AE81, #4DD9A9)' }}
                >
                  💾 ذخیره
                </button>
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="bg-white border-2 border-[#E5EBF3] hover:border-[#A9C1FA] text-[#6B7A94] px-7 py-3 rounded-[12px] text-sm font-bold transition-all"
                >
                  ✕ لغو
                </button>
              </div>
            </div>
          )}

          {/* فیلترها */}
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
              <div className="w-11 h-11 rounded-[14px] bg-[#F1ECFF] flex items-center justify-center text-xl">
                🔍
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">فیلترها</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">تراکنش‌ها را فیلتر کنید</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">اکانت</label>
                <select
                  value={filterAccount || ''}
                  onChange={(e) => setFilterAccount(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">همه</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[13px] text-[#1A2B47] font-bold block mb-2">نوع</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-[#F8FAFF] border-2 border-[#E5EBF3] rounded-[12px] px-4 py-3 text-[#1A2B47] text-sm font-semibold focus:border-[#3F7CFF] focus:bg-white focus:outline-none cursor-pointer"
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
          </div>

          {/* جدول */}
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
              <div className="w-11 h-11 rounded-[14px] bg-[#EDF3FF] flex items-center justify-center text-xl">
                📒
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">تراکنش‌ها</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">{transactions.length} تراکنش</p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-[#9AA8BF] text-sm text-center py-12">تراکنشی یافت نشد</div>
            ) : (
              <div className="overflow-x-auto rounded-[14px] border border-[#E5EBF3]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F5F7FB]">
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase rounded-r-[14px]">#</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase">نوع</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase">مبلغ</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase">اکانت</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase">توضیحات</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase">تاریخ</th>
                      <th className="text-right py-4 px-4 text-[11px] text-[#6B7A94] font-extrabold uppercase rounded-l-[14px]">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-[#E5EBF3] hover:bg-[#F8FAFF] transition-colors">
                        <td className="py-4 px-4 text-[#6B7A94] text-[12px] font-semibold">{t.id}</td>
                        <td className="py-4 px-4 text-[#1A2B47] font-bold text-[13px]">{getTypeLabel(t.transaction_type)}</td>
                        <td className={`py-4 px-4 font-extrabold text-[14px] ${getTypeColor(t.amount)}`}>
                          {t.amount >= 0 ? '+' : ''}{t.amount} $
                        </td>
                        <td className="py-4 px-4 text-[#6B7A94] text-[12px] font-semibold">
                          {t.personal_account_id ? '🏦 شخصی' : t.prop_account_id ? '🏢 پراپ' : '—'}
                        </td>
                        <td className="py-4 px-4 text-[#6B7A94] text-[12px]">{t.description || '-'}</td>
                        <td className="py-4 px-4 text-[#6B7A94] text-[12px] font-semibold">
                          {new Date(t.transaction_date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-[#E45D72] hover:bg-[#FFEDF0] px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-all"
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
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════
          تب جریان نقدی
      ═════════════════════════════════════════════ */}
      {activeTab === 'cashflow' && cashflow && (
        <>
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF5DB] flex items-center justify-center text-xl">
                🔍
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">فیلتر تاریخ</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">بازه‌ی مورد نظر را انتخاب کنید</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* کارت‌های آماری */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border-2 border-[#A8E6CF] rounded-[22px] p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #13AE81, #4DD9A9)' }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-[#E5F8F1] flex items-center justify-center text-2xl">
                  📥
                </div>
                <div className="text-[13px] text-[#6B7A94] font-bold">کل ورودی</div>
              </div>
              <div className="text-[32px] font-extrabold text-[#13AE81]">+${cashflow.total_in}</div>
            </div>

            <div className="bg-white border-2 border-[#F0A6B2] rounded-[22px] p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #E45D72, #F0A6B2)' }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-[#FFEDF0] flex items-center justify-center text-2xl">
                  📤
                </div>
                <div className="text-[13px] text-[#6B7A94] font-bold">کل خروجی</div>
              </div>
              <div className="text-[32px] font-extrabold text-[#E45D72]">-${cashflow.total_out}</div>
            </div>

            <div className={`bg-white border-2 rounded-[22px] p-6 shadow-md relative overflow-hidden ${cashflow.net >= 0 ? 'border-[#A9C1FA]' : 'border-[#F0A6B2]'}`}>
              <div className="absolute top-0 right-0 left-0 h-1" style={{ background: cashflow.net >= 0 ? 'linear-gradient(90deg, #3F7CFF, #7959D6)' : 'linear-gradient(90deg, #E45D72, #F0A6B2)' }} />
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl ${cashflow.net >= 0 ? 'bg-[#EDF3FF]' : 'bg-[#FFEDF0]'}`}>
                  💵
                </div>
                <div className="text-[13px] text-[#6B7A94] font-bold">خالص</div>
              </div>
              <div className={`text-[32px] font-extrabold ${cashflow.net >= 0 ? 'text-[#3F7CFF]' : 'text-[#E45D72]'}`}>
                {cashflow.net >= 0 ? '+' : ''}${cashflow.net}
              </div>
            </div>
          </div>

          {/* تفکیک */}
          <div className="bg-white border border-[#E5EBF3] rounded-[22px] p-6 shadow-md">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5EBF3]">
              <div className="w-11 h-11 rounded-[14px] bg-[#F1ECFF] flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A2B47]">تفکیک بر اساس نوع</h3>
                <p className="text-[12px] text-[#6B7A94] mt-0.5">جریان نقدی به تفکیک نوع تراکنش</p>
              </div>
            </div>

            {Object.keys(cashflow.by_type).length === 0 ? (
              <div className="text-[#9AA8BF] text-sm text-center py-8">تراکنشی وجود ندارد</div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(cashflow.by_type).map(([type, data]: [string, any]) => (
                  <div
                    key={type}
                    className="bg-[#F8FAFF] border border-[#E5EBF3] rounded-[14px] p-4 flex justify-between items-center hover:border-[#A9C1FA] transition-all"
                  >
                    <div>
                      <div className="text-[14px] font-extrabold text-[#1A2B47]">{getTypeLabel(type)}</div>
                      <div className="text-[11px] text-[#6B7A94] mt-1 font-semibold">{data.count} تراکنش</div>
                    </div>
                    <div className={`text-[18px] font-extrabold ${getTypeColor(data.total)}`}>
                      {data.total >= 0 ? '+' : ''}${data.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}