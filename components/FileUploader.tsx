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
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer text-center
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
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
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Extracting text from your notes...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
              Selected
            </span>
            <p className="font-semibold text-gray-800 text-lg mb-1">{selectedFile.name}</p>
            <p className="text-gray-500 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-gray-400">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium text-lg mb-2">Click to select files</p>
            <p className="text-gray-500 text-sm">or drag and drop them here</p>
            <p className="text-gray-400 text-xs mt-3">PDF, JPEG, PNG, WEBP up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
