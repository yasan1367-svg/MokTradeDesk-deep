interface BadgeProps {
  children: string;
  variant?: 'success' | 'danger' | 'info' | 'warning';
}

export default function Badge({ children, variant = 'success' }: BadgeProps) {
  const variants = {
    success: 'bg-[#E5F8F1] text-[#13AE81]',
    danger: 'bg-[#FFEDF0] text-[#E45D72]',
    info: 'bg-[#EDF3FF] text-[#3F7CFF]',
    warning: 'bg-[#FFF5DB] text-[#D99B25]',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}