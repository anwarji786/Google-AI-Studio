
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mb-6"></div>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Generating...</h2>
      <p className="text-slate-400">{message}</p>
    </div>
  );
};
