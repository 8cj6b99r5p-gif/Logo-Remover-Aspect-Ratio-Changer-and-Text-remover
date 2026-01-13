import React from 'react';
import { Sparkles, FileText } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">NoteClean AI</h1>
              <p className="text-xs text-slate-500 font-medium">NotebookLM Watermark Remover</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1">
                <FileText className="w-3 h-3"/> Doc & Image Processing
             </div>
             <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                Powered by Gemini 2.5
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;