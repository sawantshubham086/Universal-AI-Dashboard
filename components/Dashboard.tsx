import React, { useMemo, useState, useRef } from 'react';
import { INITIAL_DATA, parseCsvData } from '../constants';
import { GenericDataRecord, DatasetAnalysis, ColumnAnalysis } from '../types';
import DynamicCharts from './SalesCharts';
import MetricCard from './MetricCard';
import AiAssistant from './AiAssistant';
import ForecastWidget from './ForecastWidget';

// Helper to determine if a string looks like a date
const isDateString = (value: unknown): boolean => {
    if (typeof value !== 'string' || value.length < 6) return false;
    // Check for YYYY-MM-DD, MM/DD/YYYY, etc.
    const date = new Date(value);
    return !isNaN(date.getTime()) && (value.includes('-') || value.includes('/'));
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<GenericDataRecord[]>(INITIAL_DATA);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze the dataset structure dynamically with Intelligence
  const analysis: DatasetAnalysis = useMemo(() => {
    if (!data || data.length === 0) {
        return { 
            columns: [], 
            dateColumn: null, 
            categoryColumns: [], 
            numericColumns: [], 
            primaryMetric: null,
            primaryCategory: null,
            rowCount: 0 
        };
    }

    const firstRow = data[0];
    const rowCount = data.length;

    const columns: ColumnAnalysis[] = Object.keys(firstRow).map(key => {
        const val = firstRow[key];
        let type: 'number' | 'string' | 'date' = 'string';
        
        if (typeof val === 'number') {
            type = 'number';
        } else if (isDateString(val)) {
            type = 'date';
        }

        // Calculate uniqueness (cardinality)
        const uniqueValues = new Set(data.slice(0, 200).map(d => d[key])).size;
        
        return {
            name: key,
            type,
            uniqueValues,
            isMetric: type === 'number',
        };
    });

    const dateColumn = columns.find(c => c.type === 'date')?.name || null;

    // --- INTELLIGENT METRIC SCORING ---
    // Rank numeric columns to find the "Core" metric (e.g. Sales) vs "ID" metrics (e.g. Order ID)
    const numericCandidates = columns.filter(c => c.type === 'number');
    const scoredMetrics = numericCandidates.map(col => {
        let score = 0;
        const lower = col.name.toLowerCase();

        // High priority keywords (Core Business Metrics)
        if (lower.includes('revenue') || lower.includes('sales') || lower.includes('profit') || lower.includes('turnover')) score += 25;
        if (lower.includes('price') || lower.includes('cost') || lower.includes('close') || lower.includes('open') || lower.includes('high') || lower.includes('low')) score += 20;
        if (lower.includes('volume') || lower.includes('quantity') || lower.includes('qty') || lower.includes('amount') || lower.includes('count')) score += 15;
        if (lower.includes('rating') || lower.includes('score') || lower.includes('value') || lower.includes('balance')) score += 10;

        // Penalty keywords (Identifiers, Metadata, Dates formatted as numbers)
        // We use stricter checks for 'id' to avoid penalizing "paid", "width", "valid", etc.
        const isId = lower === 'id' || lower.endsWith('_id') || lower.endsWith(' id') || lower.startsWith('id_') || lower.startsWith('id ');
        
        if (isId || lower.includes('index') || lower.includes('code') || lower.includes('zip') || lower.includes('year') || lower.includes('phone') || lower.includes('mobile') || lower.includes('lat') || lower.includes('lon')) score -= 50;
        
        // Penalty for extremely high cardinality if it looks like an ID (unique integers often = ID)
        // But don't penalize if it has a strong financial keyword
        if (col.uniqueValues === rowCount) {
             if (score < 10) score -= 30; // Probably an ID if it's unique and not named "Price" or "Revenue"
        }

        return { name: col.name, score };
    });

    // Sort by score descending
    scoredMetrics.sort((a, b) => b.score - a.score);
    
    // Define the Primary metric (The one shown in the main chart)
    // Must have a decent score to be considered (avoids showing Order ID if it's the only number)
    const primaryMetric = scoredMetrics.length > 0 && scoredMetrics[0].score > -20 ? scoredMetrics[0].name : null;
    
    // Filter out columns that are definitely IDs for the general numeric list (to avoid showing "Total Order ID" in cards)
    const usefulNumericColumns = scoredMetrics
        .filter(m => m.score > -20) // Threshold to exclude strong ID candidates
        .map(m => m.name);


    // --- INTELLIGENT CATEGORY SCORING ---
    // Rank string columns to find the "Core" grouping (e.g. Department) vs "Description"
    const categoryCandidates = columns.filter(c => c.type === 'string' && c.uniqueValues < 100); // Only low-med cardinality
    const scoredCategories = categoryCandidates.map(col => {
        let score = 0;
        const lower = col.name.toLowerCase();

        if (lower.includes('category') || lower.includes('dept') || lower.includes('department') || lower.includes('sector') || lower.includes('segment')) score += 20;
        if (lower.includes('status') || lower.includes('region') || lower.includes('type') || lower.includes('class') || lower.includes('zone')) score += 15;
        if (lower.includes('product') || lower.includes('brand') || lower.includes('item') || lower.includes('symbol') || lower.includes('city') || lower.includes('state')) score += 10;
        if (lower.includes('name') || lower.includes('title') || lower.includes('group')) score += 5;

        // Penalize overly unique columns (likely descriptions or UUIDs)
        if (col.uniqueValues > 50) score -= 10;
        
        return { name: col.name, score };
    });

    scoredCategories.sort((a, b) => b.score - a.score);
    const primaryCategory = scoredCategories.length > 0 ? scoredCategories[0].name : null;


    return {
        columns,
        dateColumn,
        categoryColumns: scoredCategories.map(c => c.name),
        numericColumns: usefulNumericColumns, // Only return "good" metrics
        primaryMetric,
        primaryCategory,
        rowCount
    };
  }, [data]);

  // Calculate Aggregations for KPI Cards
  const kpiMetrics = useMemo(() => {
    if (analysis.numericColumns.length === 0) return [];

    // Pick top 4 numeric columns to display as KPIs
    return analysis.numericColumns.slice(0, 4).map((colName, index) => {
        // Decide whether to Sum or Average based on column name heuristic
        const lowerName = colName.toLowerCase();
        const isAverage = lowerName.includes('price') || lowerName.includes('rate') || lowerName.includes('avg') || lowerName.includes('percent') || lowerName.includes('rating') || lowerName.includes('score');
        
        const total = data.reduce((acc, curr) => acc + (Number(curr[colName]) || 0), 0);
        const value = isAverage ? total / data.length : total;
        
        // Formatting
        const formattedValue = value.toLocaleString(undefined, { 
            maximumFractionDigits: 2,
            style: lowerName.includes('price') || lowerName.includes('revenue') || lowerName.includes('cost') || lowerName.includes('sales') ? 'currency' : 'decimal',
            currency: 'USD'
        });

        const colors = ['text-blue-600', 'text-purple-600', 'text-emerald-600', 'text-amber-600'];
        
        return {
            title: isAverage ? `Avg ${colName}` : `Total ${colName}`,
            value: formattedValue,
            colorClass: colors[index % colors.length]
        };
    });
  }, [data, analysis]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
            let newData: GenericDataRecord[] = [];
            
            if (file.name.endsWith('.json')) {
                newData = JSON.parse(content);
            } else {
                newData = parseCsvData(content);
            }

            if (newData && newData.length > 0) {
                setData(newData);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                alert("Could not parse valid data from file.");
            }
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Failed to parse the file.");
        }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => {
      return Object.values(row).map(value => {
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ai_dashboard_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handlePrint = () => {
    setIsExportOpen(false);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-white">AI Dashboard</h1>
            <p className="text-slate-400 mt-1">Upload data. AI analyzes the core metrics automatically.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 relative no-print">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".csv,.json"
             />
             
             <button 
                onClick={triggerFileUpload}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
             >
                <svg className="-ml-1 mr-2 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                Upload Data
             </button>

             {data !== INITIAL_DATA && (
                 <button 
                    onClick={() => setData(INITIAL_DATA)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none transition-colors"
                 >
                    Reset Sample
                 </button>
             )}

             <div className="relative">
                <button 
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export
                </button>

                {isExportOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                    <button
                        onClick={handleExportCSV}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Export as CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                    >
                        Print / Save PDF
                    </button>
                    </div>
                </div>
                )}
            </div>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.length > 0 ? kpiMetrics.map((kpi, idx) => (
            <MetricCard 
                key={idx}
                title={kpi.title}
                value={kpi.value}
                colorClass={kpi.colorClass}
            />
        )) : (
            <div className="col-span-4 p-4 bg-slate-900 text-slate-300 rounded-lg border border-slate-800">
                Upload a dataset to see key metrics.
            </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Charts Column */}
        <div className="xl:col-span-2">
            <DynamicCharts data={data} analysis={analysis} />
            
            <ForecastWidget data={data} />

            {/* Raw Data Table (Generic) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden break-inside-avoid">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Raw Data Preview</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {analysis.columns.slice(0, 6).map((col) => (
                                    <th key={col.name} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {data.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {analysis.columns.slice(0, 6).map((col) => (
                                        <td key={`${idx}-${col.name}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {String(row[col.name])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right text-xs text-slate-400">
                   Showing first 5 rows of {analysis.rowCount} records
                </div>
            </div>
        </div>

        {/* Sidebar / AI Assistant */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
             <div className="break-inside-avoid flex-grow min-h-[500px]">
                <AiAssistant data={data} analysis={analysis} />
             </div>
             
             {/* Data Structure Info */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 break-inside-avoid">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Data Profile</h3>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Total Records</span>
                       <span className="font-semibold">{analysis.rowCount}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Date Column</span>
                       <span className="font-semibold text-indigo-600">{analysis.dateColumn || 'None'}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Primary Metric</span>
                       <span className="font-semibold text-emerald-600">{analysis.primaryMetric || 'None'}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Primary Category</span>
                       <span className="font-semibold text-purple-600">{analysis.primaryCategory || 'None'}</span>
                   </div>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;