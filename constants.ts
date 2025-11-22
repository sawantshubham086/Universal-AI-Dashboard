import { GenericDataRecord } from './types';

// Default sample data (Stocks context for demonstration)
export const RAW_CSV_DATA = `Date,Symbol,Open,Close,Volume,Sector
2024-01-01,AAPL,185.20,188.50,15000000,Tech
2024-01-02,AAPL,188.50,186.40,12000000,Tech
2024-01-03,AAPL,186.40,184.20,14500000,Tech
2024-01-01,GOOGL,138.50,140.20,8000000,Tech
2024-01-02,GOOGL,140.20,139.50,7500000,Tech
2024-01-03,GOOGL,139.50,142.10,8200000,Tech
2024-01-01,MSFT,370.00,375.50,9000000,Tech
2024-01-02,MSFT,375.50,372.80,8500000,Tech
2024-01-03,MSFT,372.80,374.00,8800000,Tech
2024-01-01,TSLA,240.00,245.50,25000000,Auto
2024-01-02,TSLA,245.50,238.20,28000000,Auto
2024-01-03,TSLA,238.20,235.10,26500000,Auto`;

// Helper to determine if a string looks like a date
const isDateString = (value: string): boolean => {
  if (!value || value.length < 6) return false;
  // Simple check for YYYY-MM-DD or MM/DD/YYYY
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.match(/\d/g)!.length >= 4;
};

// Helper to parse the CSV string into generic typed objects
export const parseCsvData = (csv: string): GenericDataRecord[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Handle simple CSV splitting (does not handle comma inside quotes perfectly, but sufficient for simple data)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const record: GenericDataRecord = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        
        if (value === undefined || value === '') {
          record[header] = null;
        } else if (!isNaN(Number(value)) && value.trim() !== '') {
          record[header] = Number(value);
        } else {
          record[header] = value;
        }
      });
      
      return record;
    });
};

export const INITIAL_DATA: GenericDataRecord[] = parseCsvData(RAW_CSV_DATA);

export const AI_MODEL_NAME = 'gemini-2.5-flash';
