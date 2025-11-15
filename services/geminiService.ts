
import { GoogleGenAI } from "@google/genai";
import type { Slide, ParsedXlsxData } from '../types';
import { presentationSchema } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generatePrompt = (docxContent: string, xlsxData: ParsedXlsxData): string => {
    const dataSummary = Object.keys(xlsxData).length > 0
        ? `
**Data Provided:**
---
Here is a summary of the data from the uploaded spreadsheets. Use this to generate data-driven insights and charts.
${JSON.stringify(xlsxData, null, 2)}
---
`
        : '';

    return `
You are an expert presentation creator. Your task is to analyze the provided text content and data to create a compelling and engaging presentation structure.
The final output MUST be a JSON array of slide objects that strictly adheres to the provided schema.

**Content Provided:**
---
${docxContent}
---
${dataSummary}

**Instructions:**
1. Read and understand all the provided text and data.
2. Synthesize the information to create a logical flow for a presentation. The presentation should have a title slide, an introduction, several body slides based on the content, and a conclusion/summary slide.
3. For each slide, provide a concise \`title\` and detailed \`content\` points (as an array of strings).
4. For slides discussing the provided spreadsheet data, create a \`chart\` object. Specify the chart \`type\` ('bar', 'pie', or 'line'), the \`data\` for the chart, and a \`title\` for the chart. The chart data should be an array of objects with \`name\`, \`labels\`, and \`values\` properties, directly derived from the spreadsheet data.
5. If the text contains phrases like "research more on..." or "find information about...", use your online research capabilities to find relevant, up-to-date information and incorporate it into the slide content. Cite the sources in the \`speakerNotes\`.
6. Provide concise \`speakerNotes\` for each slide to guide the presenter.

Generate the JSON output based on this analysis.
`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Check if it's a rate limit error (status code 429)
            if (error.message && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"))) {
                attempt++;
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1500 + Math.random() * 1000; // Exponential backoff with jitter
                    console.log(`Rate limit hit. Retrying in ${(delay / 1000).toFixed(1)}s... (Attempt ${attempt}/${maxRetries})`);
                    await sleep(delay);
                }
            } else {
                // Not a rate limit error, rethrow immediately
                throw error;
            }
        }
    }
    throw new Error(`API call failed after ${maxRetries} attempts. The service is likely busy or you've exceeded your usage quota. Please check your billing details and API plan, then try again later. Original error: ${lastError?.message}`);
}

export const generatePresentationContent = async (
    docxContent: string,
    xlsxData: ParsedXlsxData,
    researchRequested: boolean
): Promise<Slide[]> => {
    return withRetry(async () => {
        const prompt = generatePrompt(docxContent, xlsxData);
        const config = {
            responseMimeType: "application/json",
            responseSchema: presentationSchema,
            ...(researchRequested && { tools: [{ googleSearch: {} }] }),
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: config
        });

        try {
            const jsonText = response.text.trim();
            const slides = JSON.parse(jsonText) as Slide[];
            return slides;
        } catch (e) {
            console.error("Failed to parse Gemini response:", response.text);
            throw new Error("AI failed to generate a valid presentation structure. Please try again.");
        }
    });
};
