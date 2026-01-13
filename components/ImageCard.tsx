import React from 'react';
import { ExtractedImage } from '../types';
import { CheckCircle, Download, Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { downloadImage } from '../utils/pdfProcessor';

interface ImageCardProps {
  image: ExtractedImage;
  onClean: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClean }) => {
  const isDone = image.status === 'done';
  const isCleaning = image.status === 'cleaning';
  const isFailed = image.status === 'failed';
  const displayUrl = isDone && image.cleanedUrl ? image.cleanedUrl : image.originalUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="relative aspect-[3/4] bg-slate-100 group">
        <img 
          src={displayUrl} 
          alt={`Page ${image.pageIndex}`} 
          className="w-full h-full object-contain"
        />
        
        {/* Overlay for status or actions */}
        {isCleaning && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium text-indigo-900">Cleaning...</p>
            </div>
          </div>
        )}

        {/* Hover Actions for Cleaned Images */}
        {isDone && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => downloadImage(displayUrl, `cleaned-page-${image.pageIndex}.jpg`)}
              className="bg-white text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Download Cleaned Image"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Page {image.pageIndex}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDone ? 'Cleaned & Ready' : isFailed ? 'Processing Failed' : 'Original Extracted'}
            </p>
          </div>
          {isDone && <CheckCircle className="w-5 h-5 text-green-500" />}
          {isFailed && <AlertTriangle className="w-5 h-5 text-red-500" />}
        </div>

        <div className="space-y-2">
            {!isDone && !isCleaning && (
            <button
                onClick={() => onClean(image.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
                {isFailed ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {isFailed ? 'Retry' : 'Remove Logo'}
            </button>
            )}
            
            {isDone && (
                <div className="flex gap-2">
                    <button
                        onClick={() => downloadImage(displayUrl, `cleaned-page-${image.pageIndex}.jpg`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" /> Save
                    </button>
                    <button
                        onClick={() => onClean(image.id)}
                        className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Regenerate"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;