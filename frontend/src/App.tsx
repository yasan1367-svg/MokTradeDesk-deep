import { useState } from 'react';
import StatCard from './components/StatCard';
import GlassCard from './components/GlassCard';
import ImportPage from './pages/ImportPage';
import AnalysisPage from './pages/AnalysisPage';
import PropPage from './pages/PropPage';
import { compareVersions } from './api/client';
import StrategyPage from './pages/StrategyPage';
import TradesPage from './pages/TradesPage';
import ComparisonPage from './pages/ComparisonPage';

type Page = 'dashboard' | 'analysis' | 'comparison' | 'strategy' | 'trades' | 'prop' | 'import';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await compareVersions([2, 3]);
      setComparison(response.data);
    } catch (err: any) {
      setError(err.message || 'خطا در مقایسه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-l from-accent to-profit bg-clip-text text-transparent">
          🚀 MokTradeDesk
        </h1>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'dashboard', label: '📊 داشبورد' },
            { key: 'analysis', label: '📈 تحلیل' },
            { key: 'comparison', label: '⚖️ مقایسه' },
            { key: 'strategy', label: '🎯 استراتژی' },
            { key: 'trades', label: '📋 معاملات' },
            { key: 'prop', label: '🏢 پراپ' },
            { key: 'import', label: '📥 واردات' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key as Page)}
              className={`px-5 py-2 rounded-xl transition-all ${
                page === item.key
                  ? 'bg-accent text-white'
                  : 'glass-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {page === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard label="💰 سود خالص" value="+29.85 $" sub="▲ 2.5٪" color="profit" />
            <StatCard label="📈 نرخ برد" value="66.67٪" sub="از 3 معامله" />
            <StatCard label="⚠️ حداکثر ضرر" value="-29.99 $" sub="کمترین نقطه" color="loss" />
            <StatCard label="🏆 فاکتور سود" value="2.0" sub="سود کل / ضرر کل" color="accent" />
          </div>

          <GlassCard className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📊 مقایسه‌ی نسخه‌ها</h2>
              <button
                onClick={handleCompare}
                disabled={loading}
                className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'در حال مقایسه...' : 'مقایسه کن'}
              </button>
            </div>

            {error && (
              <div className="bg-loss/10 border border-loss/30 text-loss p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {comparison && (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="text-text-secondary text-sm">
                      <th className="text-right pb-3">نسخه</th>
                      <th className="text-right pb-3">معاملات</th>
                      <th className="text-right pb-3">نرخ برد</th>
                      <th className="text-right pb-3">فاکتور سود</th>
                      <th className="text-right pb-3">سود خالص</th>
                      <th className="text-right pb-3">امتیاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.items.map((item: any, idx: number) => (
                      <tr
                        key={item.version_id}
                        className={`border-t border-card-border ${
                          idx === 0 ? 'text-profit font-bold' : 'text-text-primary'
                        }`}
                      >
                        <td className="py-3">{item.version_name}</td>
                        <td className="py-3">{item.total_trades}</td>
                        <td className="py-3">{item.win_rate}٪</td>
                        <td className="py-3">{item.profit_factor}</td>
                        <td className="py-3">{item.net_pnl} $</td>
                        <td className="py-3">{item.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 bg-accent/10 border border-accent/30 text-text-primary p-4 rounded-xl">
                  <span className="text-accent font-bold">💡 پیشنهاد: </span>
                  {comparison.recommendation}
                </div>
              </>
            )}
          </GlassCard>
        </>
      )}

      {page === 'analysis' && <AnalysisPage />}
      {page === 'prop' && <PropPage />}
      {page === 'import' && <ImportPage />}
      {page === 'strategy' && <StrategyPage />}
      {page === 'trades' && <TradesPage />}
      {page === 'comparison' && <ComparisonPage />}
    </div>
  );
}

export default App;