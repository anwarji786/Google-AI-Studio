
import { Type } from "@google/genai";

export interface ChartData {
  type: 'bar' | 'pie' | 'line';
  data: Array<{
    name: string;
    labels: string[];
    values: number[];
  }>;
  title: string;
}

export interface Slide {
  title: string;
  content: string[];
  speakerNotes?: string;
  chart?: ChartData;
}

export interface ParsedXlsxData {
    [sheetName: string]: any[];
}

export const slideSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        speakerNotes: { type: Type.STRING, description: "Notes for the presenter." },
        chart: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "'bar', 'pie', or 'line'" },
                title: { type: Type.STRING, description: "Title for the chart." },
                data: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Data series name" },
                            labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                            values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        },
                        required: ["name", "labels", "values"],
                    }
                }
            },
        },
    },
    required: ["title", "content"],
};

export const presentationSchema = {
    type: Type.ARRAY,
    items: slideSchema,
};
