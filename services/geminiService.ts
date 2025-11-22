import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenericDataRecord, ForecastResponse } from '../types';
import { AI_MODEL_NAME } from '../constants';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSalesData = async (data: GenericDataRecord[], query: string, columns: string[]): Promise<string> => {
  try {
    // Limit data to first 50 rows to save tokens if dataset is huge
    const sampleData = data.slice(0, 50);
    const dataContext = JSON.stringify(sampleData);
    const columnsContext = columns.join(', ');
    
    const prompt = `
    You are a senior data analyst. Analyze the following dataset.
    
    The dataset contains the following columns: ${columnsContext}.
    
    Sample Data (First 50 rows in JSON):
    ${dataContext}
    
    User Query: ${query}
    
    Provide a concise, professional, and insightful answer. Format the answer with Markdown.
    Identify the type of data (e.g., Financial, Retail, Weather) and tailor your language accordingly.
    If the data looks like Stock data, talk about trends, volatility, and volume.
    If the data looks like Sales data, talk about revenue, growth, and products.
    `;

    const response = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are a versatile data analyst capable of interpreting any dataset.",
      }
    });

    return response.text || "No analysis could be generated at this time.";
  } catch (error) {
    console.error("Error analyzing data with Gemini:", error);
    return "I encountered an error while trying to analyze the data. Please check your API key and try again.";
  }
};

export const generateSalesForecast = async (data: GenericDataRecord[]): Promise<ForecastResponse | null> => {
  try {
    const sampleData = data.slice(0, 50);
    const dataContext = JSON.stringify(sampleData);
    
    const prompt = `
    Based on the historical data provided below, predict future trends.
    First, identify the main entity (e.g., Product Name, Stock Symbol, City) and the main metric (e.g., Sales, Close Price, Temperature).
    Then, provide a forecast.
    
    Dataset Sample:
    ${dataContext}
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        topEntities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              entityName: { type: Type.STRING, description: "The name of the item/stock/entity" },
              predictedTrend: { type: Type.STRING, description: "e.g., 'Bullish', '+15%', 'Increasing'" },
              reasoning: { type: Type.STRING, description: "Brief explanation based on data patterns." }
            },
            required: ["entityName", "predictedTrend", "reasoning"]
          }
        },
        marketOutlook: { type: Type.STRING, description: "General summary of the dataset trend." },
        recommendation: { type: Type.STRING, description: "Actionable advice based on the data." }
      },
      required: ["topEntities", "marketOutlook", "recommendation"]
    };

    const response = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert forecaster. Analyze the pattern and predict the future state."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ForecastResponse;
    }
    return null;
  } catch (error) {
    console.error("Error generating forecast:", error);
    return null;
  }
};
