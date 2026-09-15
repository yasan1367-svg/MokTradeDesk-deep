interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NAV_GROUPS = [
  {
    label: 'عملیات',
    items: [
      { key: 'dashboard', icon: '📊', label: 'داشبورد' },
      { key: 'analysis', icon: '📈', label: 'تحلیل' },
      { key: 'comparison', icon: '⚖️', label: 'مقایسه' },
    ],
  },
  {
  label: 'تحقیق و توسعه',
  items: [
    { key: 'strategy', icon: '🎯', label: 'استراتژی' },
    { key: 'trades', icon: '📋', label: 'معاملات' },
    { key: 'journal', icon: '📔', label: 'ژورنال' },
  ],
},
  {
    label: 'حساب‌ها',
    items: [
      { key: 'prop', icon: '🏢', label: 'پراپ' },
      { key: 'personal', icon: '🏦', label: 'شخصی' },
    ],
  },
  {
  label: 'سیستم',
  items: [
    { key: 'import', icon: '📥', label: 'واردات' },
  ],
},
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-[260px] bg-[#152238] text-[#B9C8DE] flex flex-col py-5 overflow-y-auto shadow-[4px_0_24px_rgba(21,34,56,0.15)] z-10 shrink-0">
      {/* لوگو */}
      <div className="px-5 pb-7 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl text-white shadow-[0_8px_20px_rgba(63,124,255,0.4)] shrink-0"
          style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
        >
          ⚡
        </div>
        <div>
          <div className="text-2xl font-extrabold text-white leading-tight">MokTradeDesk</div>
          <div className="text-[12px] text-[#8DA2C1] tracking-wider mt-0.5">Analyze • Improve • Grow</div>
        </div>
      </div>

      {/* ناوبری */}
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-2">
          <div className="px-5 py-3 pb-1 text-[12px] text-[#8DA2C1] uppercase tracking-widest font-bold">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <div
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex items-center gap-3 mx-3 px-5 py-3.5 rounded-[10px] cursor-pointer text-[17px] transition-all relative ${
                  isActive
                    ? 'text-white bg-[#1E2F4D] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                    : 'text-[#B9C8DE] hover:text-white hover:bg-[#1E2F4D]'
                }`}
              >
                {isActive && (
                  <div className="absolute right-[-12px] top-2.5 bottom-2.5 w-[3px] bg-[#76A4FF] rounded-r-sm" />
                )}
                <span className="text-xl w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      ))}

      {/* پروفایل */}
      <div className="mt-auto px-5 py-4 border-t border-white/[0.08] flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-[#3563BE] shadow-[0_4px_10px_rgba(0,0,0,0.15)] shrink-0"
          style={{ background: 'linear-gradient(135deg, #DCE8FF, #C5D9FF)' }}
        >
          ی‌م
        </div>
        <div>
          <div className="text-[16px] font-bold text-white">یوسف مکاری</div>
          <div className="text-[12px] text-[#8DA2C1]">Pro Trader</div>
        </div>
      </div>
    </aside>
  );
}