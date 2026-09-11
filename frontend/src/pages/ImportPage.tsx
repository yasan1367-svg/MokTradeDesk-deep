import { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import { getAllVersions, importSoft4X, importMT4 } from '../api/client';

interface Version {
  id: number;
  version_name: string;
  strategy_name: string;
}

export default function ImportPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [fileType, setFileType] = useState<'soft4x' | 'mt4'>('soft4x');
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [testType, setTestType] = useState<'backtest' | 'forward' | 'real'>('backtest');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllVersions()
      .then((res) => setVersions(res.data))
      .catch((err) => console.error('خطا در دریافت نسخه‌ها:', err));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('لطفاً یک فایل انتخاب کنید');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      if (fileType === 'soft4x') {
        response = await importSoft4X(file, selectedVersion || undefined, symbol, testType);
      } else {
        response = await importMT4(file, selectedVersion || undefined, testType);
      }
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'خطا در آپلود فایل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تنظیمات */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-4">⚙️ تنظیمات</h2>

          {/* نوع فایل */}
          <div className="mb-5">
            <label className="text-text-secondary text-sm block mb-2">نوع فایل</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFileType('soft4x')}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  fileType === 'soft4x' ? 'bg-accent text-white' : 'bg-card border border-card-border text-text-secondary'
                }`}
              >
                📊 Soft4X (اکسل)
              </button>
              <button
                onClick={() => setFileType('mt4')}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  fileType === 'mt4' ? 'bg-accent text-white' : 'bg-card border border-card-border text-text-secondary'
                }`}
              >
                📈 متاتریدر (HTML)
              </button>
            </div>
          </div>

          {/* نماد (فقط Soft4X) */}
          {fileType === 'soft4x' && (
            <div className="mb-5">
              <label className="text-text-secondary text-sm block mb-2">نماد</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="XAUUSD">🥇 طلا (XAUUSD)</option>
                <option value="DJIUSD">📊 داوجونز (DJIUSD)</option>
              </select>
            </div>
          )}

          {/* نوع تست */}
          <div className="mb-5">
            <label className="text-text-secondary text-sm block mb-2">نوع تست</label>
            <div className="flex gap-2">
              {[
                { value: 'backtest', label: '🧪 بک‌تست' },
                { value: 'forward', label: '🔬 فوروارد' },
                { value: 'real', label: '💰 رییل' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTestType(t.value as any)}
                  className={`flex-1 py-3 rounded-xl transition-all text-sm ${
                    testType === t.value ? 'bg-accent text-white' : 'bg-card border border-card-border text-text-secondary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* نسخه */}
          <div className="mb-5">
            <label className="text-text-secondary text-sm block mb-2">نسخه‌ی استراتژی</label>
            <select
              value={selectedVersion || ''}
              onChange={(e) => setSelectedVersion(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">— بدون نسخه —</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.strategy_name} / {v.version_name}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* آپلود */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-4">📤 آپلود فایل</h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'border-accent bg-accent/10' : 'border-card-border hover:border-accent/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={fileType === 'soft4x' ? '.xlsx' : '.html'}
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div>
                <div className="text-4xl mb-3">📄</div>
                <div className="text-text-primary font-bold">{file.name}</div>
                <div className="text-text-secondary text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</div>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-3 opacity-50">📁</div>
                <div className="text-text-primary font-bold mb-2">فایل را اینجا رها کنید</div>
                <div className="text-text-secondary text-sm">یا کلیک کنید</div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="w-full mt-5 bg-accent hover:bg-accent/80 text-white py-3 rounded-xl transition-all disabled:opacity-50 font-bold"
          >
            {loading ? '⏳ در حال پردازش...' : '🚀 وارد کن'}
          </button>

          {error && (
            <div className="mt-4 bg-loss/10 border border-loss/30 text-loss p-3 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}
        </GlassCard>
      </div>

      {/* نتیجه */}
      {result && (
        <GlassCard className="mt-6">
          <h2 className="text-xl font-bold mb-4">✅ نتیجه‌ی واردات</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="text-text-secondary text-xs mb-1">شناسایی‌شده</div>
              <div className="text-2xl font-bold">{result.total_trades}</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="text-text-secondary text-xs mb-1">ذخیره‌شده</div>
              <div className={`text-2xl font-bold ${result.saved_trades > 0 ? 'text-profit' : 'text-text-primary'}`}>
                {result.saved_trades}
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="text-text-secondary text-xs mb-1">وضعیت</div>
              <div className="text-sm font-bold text-accent">{result.message}</div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}