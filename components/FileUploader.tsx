'use client';

import React, { useState, useRef } from 'react';
import { validateAndPrepareFile } from '../lib/processUpload';

export interface FileUploaderProps {
  onTextExtracted: (text: string) => void;
  onError: (error: string) => void;
}

export function FileUploader({ onTextExtracted, onError }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const validation = validateAndPrepareFile(file);
    if (!validation.valid) {
      onError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract text from file.');
      }

      const data = await res.json();
      if (!data.extractedText) {
        throw new Error('No text extracted from the document.');
      }

      onTextExtracted(data.extractedText);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An unknown error occurred during upload.');
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] transition-all duration-300 cursor-pointer text-center
          ${isDragging ? 'border-[#3B5CFF] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}
          ${isLoading ? 'opacity-75 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="application/pdf,image/jpeg,image/png,image/webp"
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-[#3B5CFF] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-700 font-bold">Extracting text from your notes...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg mb-1">{selectedFile.name}</p>
              <p className="text-slate-400 text-sm font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to go</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-6 w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-[#3B5CFF] group-hover:bg-blue-50 transition-all duration-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-slate-800 font-bold text-xl mb-2">Click to select files</p>
            <p className="text-slate-500 font-medium">or drag and drop them here</p>
            <div className="mt-6 flex gap-2">
              {['PDF', 'JPEG', 'PNG'].map(ext => (
                <span key={ext} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 tracking-widest">{ext}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
