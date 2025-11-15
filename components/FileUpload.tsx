
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incomingFiles: FileList | null) => {
    if (incomingFiles) {
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"       // .xlsx
      ];
      const validFiles = Array.from(incomingFiles).filter(file => allowedTypes.includes(file.type));
      setFiles(validFiles);
      onFileChange(validFiles);
    }
  }, [onFileChange]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter(f => f.name !== fileName);
    setFiles(updatedFiles);
    onFileChange(updatedFiles);
  }

  return (
    <div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-800'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".docx,.xlsx"
          onChange={handleInputChange}
          className="hidden"
        />
        <UploadIcon className="h-12 w-12 text-slate-500 mb-4" />
        <p className="text-slate-400 text-center">
          <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500 mt-1">.docx and .xlsx files only</p>
      </div>
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-md">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-6 w-6 text-slate-400"/>
                  <span className="text-slate-300">{file.name}</span>
                </div>
                <button onClick={() => removeFile(file.name)} className="text-red-400 hover:text-red-300 font-bold">&times;</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
