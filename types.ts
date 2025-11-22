export interface GenericDataRecord {
  [key: string]: string | number | null;
}

export interface ColumnAnalysis {
  name: string;
  type: 'number' | 'string' | 'date';
  uniqueValues: number; // cardinality
  isMetric: boolean;
}

export interface DatasetAnalysis {
  columns: ColumnAnalysis[];
  dateColumn: string | null;
  categoryColumns: string[];
  numericColumns: string[];
  primaryMetric: string | null;   // The most important number (e.g., Revenue, Close Price)
  primaryCategory: string | null; // The most important grouping (e.g., Department, Sector)
  rowCount: number;
}

export interface AiResponse {
  analysis: string;
}

export interface ForecastItem {
  entityName: string; // Product name, Stock Symbol, etc.
  predictedTrend: string;
  reasoning: string;
}

export interface ForecastResponse {
  topEntities: ForecastItem[];
  marketOutlook: string;
  recommendation: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}