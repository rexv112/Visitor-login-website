
import React from 'react';

/**
 * Interface defines what data this component needs to work.
 */
interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

/**
 * StatsCard is a presentation component that displays a number and a label.
 */
const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color }) => {
  return (
    // Tailwind CSS used for the card's styling and responsive behavior (mobile vs desktop)
    <div className="bg-white p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2.5 md:gap-4 transition-transform hover:scale-[1.02]">
      {/* Icon container with dynamic background color from props */}
      <div className={`p-2 md:p-4 rounded-lg md:rounded-xl ${color} text-white shrink-0`}>
        {/* React.cloneElement is used to inject Tailwind classes into the Lucide icon passed as a prop */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5 md:w-6 md:h-6' })}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] md:text-sm font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-base md:text-3xl font-bold text-slate-800 leading-tight">
          {/* Format large numbers (e.g., 10000 -> 10k) for better readability */}
          {value >= 10000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
