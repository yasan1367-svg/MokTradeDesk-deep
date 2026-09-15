import { useState } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisPage from './pages/AnalysisPage';
import ComparisonPage from './pages/ComparisonPage';
import StrategyPage from './pages/StrategyPage';
import TradesPage from './pages/TradesPage';
import JournalPage from './pages/JournalPage';
import PropPage from './pages/PropPage';
import PersonalPage from './pages/PersonalPage';
import ImportPage from './pages/ImportPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

type Page = 'dashboard' | 'analysis' | 'comparison' | 'strategy' | 'trades' | 'journal' | 'prop' | 'personal' | 'import' | 'settings';

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: '📊 داشبورد', subtitle: 'نمای کلی عملکرد معاملاتی' },
  analysis: { title: '📈 تحلیل', subtitle: 'تحلیل کامل یک نسخه' },
  comparison: { title: '⚖️ مقایسه', subtitle: 'مقایسه‌ی چند نسخه' },
  strategy: { title: '🎯 استراتژی', subtitle: 'مدیریت استراتژی‌ها و نسخه‌ها' },
  trades: { title: '📋 معاملات', subtitle: 'مدیریت معاملات و اسکرین‌شات' },
  journal: { title: '📔 ژورنال', subtitle: 'مرور و درس‌های معاملات' },
  prop: { title: '🏢 پراپ', subtitle: 'مدیریت چالش‌های پراپ' },
  personal: { title: '🏦 شخصی', subtitle: 'معاملات شخصی و حسابداری' },
  import: { title: '📥 واردات', subtitle: 'واردات معاملات از فایل' },
  settings: { title: '⚙️ تنظیمات', subtitle: 'تنظیمات نرم‌افزار' },
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar currentPage={page} onNavigate={(p) => setPage(p as Page)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[68px] bg-white/85 backdrop-blur-xl border-b border-[#E5EBF3] flex items-center justify-between px-7 shrink-0">
          <div>
            <div className="text-base font-bold text-[#1A2B47]">{PAGE_TITLES[page].title}</div>
            <div className="text-xs text-[#6B7A94] mt-0.5">{PAGE_TITLES[page].subtitle}</div>
          </div>
          <div className="flex gap-3 items-center">
            <button className="w-10 h-10 rounded-xl bg-white border border-[#E5EBF3] flex items-center justify-center cursor-pointer text-base text-[#6B7A94] transition-all hover:bg-[#EDF3FF] hover:border-[#A9C1FA] hover:text-[#3F7CFF]">
              🔔
            </button>
            <button className="w-10 h-10 rounded-xl bg-white border border-[#E5EBF3] flex items-center justify-center cursor-pointer text-base text-[#6B7A94] transition-all hover:bg-[#EDF3FF] hover:border-[#A9C1FA] hover:text-[#3F7CFF]">
              ☀️
            </button>
            <button className="w-10 h-10 rounded-xl bg-white border border-[#E5EBF3] flex items-center justify-center cursor-pointer text-base text-[#6B7A94] transition-all hover:bg-[#EDF3FF] hover:border-[#A9C1FA] hover:text-[#3F7CFF]">
              ⚙️
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'analysis' && <AnalysisPage />}
          {page === 'comparison' && <ComparisonPage />}
          {page === 'strategy' && <StrategyPage />}
          {page === 'trades' && <TradesPage />}
          {page === 'journal' && <JournalPage />}
          {page === 'prop' && <PropPage />}
          {page === 'personal' && <PersonalPage />}
          {page === 'import' && <ImportPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}