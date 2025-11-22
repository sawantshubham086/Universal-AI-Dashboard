import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { GenericDataRecord, DatasetAnalysis } from '../types';

interface DynamicChartsProps {
  data: GenericDataRecord[];
  analysis: DatasetAnalysis;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

const DynamicCharts: React.FC<DynamicChartsProps> = ({ data, analysis }) => {
  
  const { dateColumn, primaryMetric, primaryCategory, numericColumns } = analysis;

  // 1. Trend Chart (Time Series)
  // Logic: Use Date as X-Axis, Primary Intelligent Metric as Y-Axis
  const renderTrendChart = () => {
    if (!dateColumn || !primaryMetric) return null;
    
    // Sort by date for proper line chart
    const sortedData = [...data].sort((a, b) => 
      new Date(String(a[dateColumn])).getTime() - new Date(String(b[dateColumn])).getTime()
    );

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
        <h3 className="text-lg font-bold text-slate-800 mb-4 capitalize">{primaryMetric} Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey={dateColumn} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10} 
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey={primaryMetric} 
                stroke="#4f46e5" 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
                name={primaryMetric}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // 2. Category Distribution Chart
  // Logic: Group by Primary Intelligent Category, Sum/Avg the Primary Metric
  const renderCategoryChart = () => {
    if (!primaryCategory || !primaryMetric) return null;

    // Aggregation Logic
    const aggMap = new Map<string, number>();
    data.forEach(item => {
      const key = String(item[primaryCategory]);
      const val = Number(item[primaryMetric]) || 0;
      aggMap.set(key, (aggMap.get(key) || 0) + val);
    });
    
    const chartData = Array.from(aggMap, ([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 10); // Top 10 only

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 capitalize">{primaryMetric} by {primaryCategory}</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name={primaryMetric} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // 3. Distribution Pie Chart
  // Logic: Same as above but Pie
  const renderPieChart = () => {
     if (!primaryCategory || !primaryMetric) return null;

     // Aggregation Logic
     const aggMap = new Map<string, number>();
     data.forEach(item => {
       const key = String(item[primaryCategory]);
       const val = Number(item[primaryMetric]) || 0;
       aggMap.set(key, (aggMap.get(key) || 0) + val);
     });
     
     const chartData = Array.from(aggMap, ([name, value]) => ({ name, value }))
       .sort((a,b) => b.value - a.value)
       .slice(0, 6); // Top 6 for pie

      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 capitalize">{primaryCategory} Share</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
  };

  // 4. Fallback or Secondary Line (e.g. Volume)
  // Logic: If we have a date, but only one metric, or if we have no categories
  const renderSecondaryLine = () => {
    if (!dateColumn || numericColumns.length < 2) return null;
    
    // Find a metric that IS NOT the primary metric (e.g. Volume if Primary is Close)
    const secondaryMetric = numericColumns.find(m => m !== primaryMetric);
    if (!secondaryMetric) return null;

    const sortedData = [...data].sort((a, b) => 
      new Date(String(a[dateColumn])).getTime() - new Date(String(b[dateColumn])).getTime()
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4 capitalize">{secondaryMetric} Trend</h3>
            <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey={dateColumn} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                    type="monotone" 
                    dataKey={secondaryMetric} 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                    name={secondaryMetric}
                />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {renderTrendChart()}
      
      {primaryCategory ? (
          <>
            {renderCategoryChart()}
            {renderPieChart()}
          </>
      ) : (
         renderSecondaryLine()
      )}
      
      {/* Fallback if no valid visualization is found */}
      {!primaryMetric && !primaryCategory && (
         <div className="col-span-1 lg:col-span-2 p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <p>Not enough recognized data patterns to generate charts.</p>
         </div>
      )}
    </div>
  );
};

export default DynamicCharts;