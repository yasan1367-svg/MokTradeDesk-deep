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
    <aside className="w-[250px] bg-[#152238] text-[#B9C8DE] flex flex-col py-5 overflow-y-auto shadow-[4px_0_24px_rgba(21,34,56,0.15)] z-10 shrink-0">
      <div className="px-5 pb-7 flex flex-col gap-2">
  <div className="flex items-center gap-3">
    <div
      className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl text-white shadow-[0_8px_20px_rgba(63,124,255,0.4)] shrink-0"
      style={{ background: 'linear-gradient(135deg, #3F7CFF, #5B8DEF)' }}
    >
      ⚡
    </div>
    <div className="text-xl font-extrabold text-white leading-tight">MokTradeDesk</div>
  </div>
  <div className="text-[10px] text-[#8DA2C1] tracking-wider pr-[54px]">Analyze • Improve • Grow</div>
</div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-1.5">
          <div className="px-5 py-3 pb-1 text-[15px] text-[#8DA2C1] uppercase tracking-widest font-semibold">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <div
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex items-center gap-3 mx-3 px-5 py-3 rounded-[10px] cursor-pointer text-sm transition-all relative ${
                  isActive
                    ? 'text-white bg-[#1E2F4D] font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                    : 'text-[#B9C8DE] hover:text-white hover:bg-[#1E2F4D]'
                }`}
              >
                {isActive && (
                  <div className="absolute right-[-12px] top-2 bottom-2 w-[3px] bg-[#76A4FF] rounded-r-sm" />
                )}
                <span className="text-base w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      ))}

      <div className="mt-auto px-5 py-4 border-t border-white/[0.08] flex items-center gap-3">
        <div
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-xs font-bold text-[#3563BE] shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
          style={{ background: 'linear-gradient(135deg, #DCE8FF, #C5D9FF)' }}
        >
          ی‌م
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Mokary</div>
          <div className="text-[15px] text-[#8DA2C1]">Pro Trader</div>
        </div>
      </div>
    </aside>
  );
}