import React, { useState } from 'react';
import { GenericDataRecord, ForecastResponse, LoadingState } from '../types';
import { generateSalesForecast } from '../services/geminiService';

interface ForecastWidgetProps {
  data: GenericDataRecord[];
}

const ForecastWidget: React.FC<ForecastWidgetProps> = ({ data }) => {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  const handleGenerateForecast = async () => {
    setStatus(LoadingState.LOADING);
    const result = await generateSalesForecast(data);
    if (result) {
      setForecast(result);
      setStatus(LoadingState.SUCCESS);
    } else {
      setStatus(LoadingState.ERROR);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-white opacity-5"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart Forecast</h2>
              <p className="text-indigo-200 text-sm">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          
          {status === LoadingState.IDLE && (
             <button 
             onClick={handleGenerateForecast}
             className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg text-sm font-semibold shadow-sm transition-colors"
           >
             Analyze Trends
           </button>
          )}

          {status === LoadingState.LOADING && (
            <div className="flex items-center text-sm font-medium text-indigo-100">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Data...
            </div>
          )}
        </div>

        {status === LoadingState.ERROR && (
           <div className="bg-red-500/20 border border-red-200/20 p-4 rounded-lg text-sm mb-4 backdrop-blur-sm">
             Failed to generate forecast. Please check your connection and try again.
             <button onClick={handleGenerateForecast} className="ml-2 underline font-semibold">Retry</button>
           </div>
        )}

        {status === LoadingState.IDLE && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/10 text-center">
                <p className="text-indigo-100">Click Analyze to detect patterns and predict future performance for this dataset.</p>
            </div>
        )}

        {forecast && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.topEntities.map((item, idx) => (
                <div key={idx} className="bg-white/10 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Top Trend #{idx + 1}</span>
                    <span className="bg-green-400/20 text-green-300 text-xs font-bold px-2 py-0.5 rounded-full border border-green-400/30">
                      {item.predictedTrend}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{item.entityName}</h3>
                  <p className="text-sm text-indigo-100 opacity-90 leading-relaxed">{item.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-200 text-sm uppercase mb-1">Outlook</h4>
                    <p className="text-sm">{forecast.marketOutlook}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                     <h4 className="font-semibold text-indigo-200 text-sm uppercase mb-1">Recommendation</h4>
                    <p className="text-sm">{forecast.recommendation}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastWidget;
