import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass: string; 
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon, trend, colorClass }) => {
  // Extract specific color code from class or default to blue
  const iconBg = colorClass.includes('purple') ? 'bg-purple-100' : 
                 colorClass.includes('emerald') ? 'bg-emerald-100' :
                 colorClass.includes('amber') ? 'bg-amber-100' : 'bg-blue-100';

  const iconText = colorClass.includes('purple') ? 'text-purple-600' : 
                   colorClass.includes('emerald') ? 'text-emerald-600' :
                   colorClass.includes('amber') ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 border border-slate-100 h-full">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${iconBg} ${iconText}`}>
          {icon ? (
            React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6` }) : icon
          ) : (
             // Default generic icon if none provided
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
          )}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate capitalize">{title.replace(/_/g, ' ')}</dt>
            <dd>
              <div className="text-2xl font-bold text-slate-900 truncate">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      
      {(trend || subtext) && (
        <div className="mt-4 flex items-center justify-between">
           {subtext && <p className="text-sm text-slate-500">{subtext}</p>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
