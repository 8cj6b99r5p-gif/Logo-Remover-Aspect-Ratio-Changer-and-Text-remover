import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, Loader2, Image as ImageIcon, Copy } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isProcessing: boolean;
  modeText: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, modeText }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'));
      
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      } else {
        alert('Please upload valid PDF or Image files.');
      }
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFileSelect(files);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 hover:border-indigo-400 bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf, image/png, image/jpeg, image/webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleInputChange}
          disabled={isProcessing}
          multiple
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
             <div className="bg-indigo-100 p-4 rounded-full animate-pulse">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             </div>
          ) : (
            <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`} />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isProcessing ? 'Processing Files...' : `Upload Files to ${modeText}`}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isProcessing 
                ? 'AI is working its magic. This may take a moment.' 
                : 'Drag and drop PDF or Images (JPG, PNG). Multiple files supported.'}
            </p>
          </div>

          {!isProcessing && (
            <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><FileType className="w-3 h-3" /> PDF</span>
                <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> PNG, JPG</span>
                <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Multiple</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;