
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { PresentationIcon } from './components/icons/PresentationIcon';
import { parseFiles } from './services/fileParser';
import { generatePresentationContent } from './services/geminiService';
import { createPresentation } from './services/presentationService';
import type { Slide } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pptxBlob, setPptxBlob] = useState<Blob | null>(null);

  const handleFileChange = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setPptxBlob(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) {
      setError("Please upload at least one DOCX or XLSX file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPptxBlob(null);

    try {
      setLoadingMessage("Parsing and reading your files...");
      const { docxContent, xlsxData, researchRequested } = await parseFiles(files);

      setLoadingMessage("Analyzing content with AI...");
      const presentationStructure = await generatePresentationContent(docxContent, xlsxData, researchRequested);
      
      setLoadingMessage("Building your presentation...");
      const blob = await createPresentation(presentationStructure, xlsxData);
      setPptxBlob(blob);

    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [files]);

  const handleDownload = () => {
    if (pptxBlob) {
      const url = URL.createObjectURL(pptxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.pptx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <PresentationIcon className="h-10 w-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
              AI Presentation Generator
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload your documents, and let AI craft a stunning presentation with data analysis and research.
          </p>
        </header>

        <main className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-8 border border-slate-700">
          {isLoading ? (
            <Loader message={loadingMessage} />
          ) : (
            <>
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 text-center">
                  {error}
                </div>
              )}
              
              <FileUpload onFileChange={handleFileChange} />

              <div className="mt-8 text-center">
                <button
                  onClick={handleGenerate}
                  disabled={files.length === 0}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {pptxBlob ? 'Regenerate Presentation' : 'Generate Presentation'}
                </button>
              </div>

              {pptxBlob && (
                <div className="mt-8 p-6 bg-green-500/10 border border-green-500 rounded-lg text-center animate-fade-in">
                  <h3 className="text-2xl font-bold text-green-300 mb-4">Your Presentation is Ready!</h3>
                  <button
                    onClick={handleDownload}
                    className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 transform transition-colors duration-300"
                  >
                    Download .pptx
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AI Presentation Generator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
