import type { ParsedXlsxData } from '../types';
import { loadScript } from './scriptLoader';

const MAMMOTH_CDN = "https://cdn.jsdelivr.net/npm/mammoth@1.7.1/mammoth.browser.min.js";
const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

export const parseFiles = async (files: File[]): Promise<{ docxContent: string, xlsxData: ParsedXlsxData, researchRequested: boolean }> => {
    const [mammoth, XLSX] = await Promise.all([
        loadScript(MAMMOTH_CDN, 'mammoth'),
        loadScript(XLSX_CDN, 'XLSX'),
    ]);

    let docxContent = '';
    const xlsxData: ParsedXlsxData = {};
    let researchRequested = false;

    for (const file of files) {
        const buffer = await readFileAsArrayBuffer(file);

        if (file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            const text = result.value;
            docxContent += `\n\n--- Content from ${file.name} ---\n${text}`;
            if (text.toLowerCase().includes('research') || text.toLowerCase().includes('find information on')) {
                researchRequested = true;
            }
        } else if (file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
            workbook.SheetNames.forEach((sheetName: string) => {
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                if (json.length > 0) {
                   xlsxData[`${file.name} - ${sheetName}`] = json;
                }
            });
        }
    }

    return { docxContent, xlsxData, researchRequested };
};
