import React, { useState, useEffect } from 'react';
import { analyzeSalesData } from '../services/geminiService';
import { GenericDataRecord, LoadingState, DatasetAnalysis } from '../types';
import ReactMarkdown from 'react-markdown';

interface AiAssistantProps {
  data: GenericDataRecord[];
  analysis: DatasetAnalysis;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ data, analysis }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  
  const predefinedQueries = [
    "Summarize this dataset",
    "What are the key trends?",
    "Identify outliers",
    "Predict next week's performance"
  ];

  const handleAnalyze = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setStatus(LoadingState.LOADING);
    setResponse(null);

    try {
      // Pass column names to context
      const columnNames = analysis.columns.map(c => c.name);
      const result = await analyzeSalesData(data, activeQuery, columnNames);
      setResponse(result);
      setStatus(LoadingState.SUCCESS);
    } catch (e) {
      setStatus(LoadingState.ERROR);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-md">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h2 className="font-semibold text-slate-800">AI Data Analyst</h2>
        </div>
      </div>
      
      <div className="p-6 space-y-6 flex-grow flex flex-col">
        {/* Response Area */}
        <div className="flex-grow bg-slate-50 rounded-lg p-4 text-sm text-slate-700 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
            {status === LoadingState.IDLE && !response && (
                <div className="text-center text-slate-400 mt-8">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p>I can analyze any data you upload. Ask me about trends, correlations, or summaries.</p>
                </div>
            )}
            
            {status === LoadingState.LOADING && (
                <div className="flex items-center justify-center h-full space-x-2 text-indigo-500">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                </div>
            )}

            {response && (
                <div className="prose prose-sm max-w-none prose-indigo">
                    <ReactMarkdown>{response}</ReactMarkdown>
                </div>
            )}
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          {predefinedQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(q); handleAnalyze(q); }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ask about your data..."
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 pr-12 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button 
            onClick={() => handleAnalyze()}
            disabled={status === LoadingState.LOADING}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
