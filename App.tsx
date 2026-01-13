import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ImageCard from './components/ImageCard';
import { ExtractedImage, ProcessingStatus, AppMode } from './types';
import { extractImagesFromPdf, processImageFiles, downloadAllImagesAsZip } from './utils/pdfProcessor';
import { cleanImage, convertImageToVertical, removeTextFromImage, customizeTextInImage } from './services/geminiService';
import { Trash2, Archive, RefreshCw, AlertCircle, Sparkles, Smartphone, Eraser, Type } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.CLEAN);
  const [customInstruction, setCustomInstruction] = useState<string>("");

  // Reusable function to process a specific image object based on current mode
  const processImageItem = useCallback(async (image: ExtractedImage) => {
    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, status: 'cleaning' } : img
    ));

    try {
      let resultUrl = '';
      if (mode === AppMode.CLEAN) {
        resultUrl = await cleanImage(image.originalUrl);
      } else if (mode === AppMode.CONVERT) {
        resultUrl = await convertImageToVertical(image.originalUrl);
      } else if (mode === AppMode.REMOVE_TEXT) {
        resultUrl = await removeTextFromImage(image.originalUrl);
      } else if (mode === AppMode.CUSTOMIZE_TEXT) {
        resultUrl = await customizeTextInImage(image.originalUrl, customInstruction || "Maintain original fonts.");
      }
      
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'done', cleanedUrl: resultUrl } : img
      ));
    } catch (err) {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'failed' } : img
      ));
    }
  }, [mode, customInstruction]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (mode === AppMode.CUSTOMIZE_TEXT && !customInstruction.trim()) {
      alert("Please enter text customization instructions before uploading.");
      return;
    }

    try {
      setStatus(ProcessingStatus.EXTRACTING);
      setError(null);
      setImages([]);
      
      let extracted: ExtractedImage[] = [];

      // Separate PDFs from Images
      const pdfs = files.filter(f => f.type === 'application/pdf');
      const imgFiles = files.filter(f => f.type.startsWith('image/'));

      // Process PDFs
      for (const pdf of pdfs) {
        const pdfImages = await extractImagesFromPdf(pdf);
        extracted = [...extracted, ...pdfImages];
      }

      // Process Images
      if (imgFiles.length > 0) {
        const processedImages = await processImageFiles(imgFiles);
        extracted = [...extracted, ...processedImages];
      }
      
      // Re-index pages for clean display
      extracted = extracted.map((img, idx) => ({ ...img, pageIndex: idx + 1 }));

      if (extracted.length === 0) {
        throw new Error("No images could be extracted or processed.");
      }

      setImages(extracted);
      setStatus(ProcessingStatus.CLEANING);
      
      // Automatically start processing all extracted images
      extracted.forEach(img => {
        processImageItem(img);
      });

    } catch (err: any) {
      console.error(err);
      setError("Failed to process the files. Please try again.");
      setStatus(ProcessingStatus.ERROR);
    }
  }, [processImageItem, mode, customInstruction]);

  const handleSingleItemRetry = useCallback((id: string) => {
    const imageToClean = images.find(img => img.id === id);
    if (imageToClean) {
      processImageItem(imageToClean);
    }
  }, [images, processImageItem]);

  const handleRetryFailed = useCallback(() => {
    const failedImages = images.filter(img => img.status === 'failed' || img.status === 'pending');
    failedImages.forEach(img => {
        processImageItem(img);
    });
  }, [images, processImageItem]);

  const handleDownloadAll = useCallback(() => {
    downloadAllImagesAsZip(images.filter(img => img.status === 'done'));
  }, [images]);

  const handleReset = () => {
    setImages([]);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
  };

  const allCleaned = images.length > 0 && images.every(img => img.status === 'done');
  const hasFailures = images.some(img => img.status === 'failed');
  const isProcessing = images.some(img => img.status === 'cleaning' || img.status === 'pending');

  const getModeDescription = () => {
    switch(mode) {
      case AppMode.CLEAN: return "Automatically detect and remove any logos or watermarks.";
      case AppMode.CONVERT: return "Convert landscape (16:9) photos to vertical (9:16) while preserving text layout.";
      case AppMode.REMOVE_TEXT: return "Remove all text from the image while preserving the background.";
      case AppMode.CUSTOMIZE_TEXT: return "Change existing text or add new text matching the original fonts.";
      default: return "";
    }
  };

  const getModeTitle = () => {
    switch(mode) {
      case AppMode.CLEAN: return "Remove Logos";
      case AppMode.CONVERT: return "Convert";
      case AppMode.REMOVE_TEXT: return "Remove Text";
      case AppMode.CUSTOMIZE_TEXT: return "Customize Text";
      default: return "Process";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {status === ProcessingStatus.IDLE && (
           <div className="mt-8 text-center animate-fade-in">
             <h2 className="text-4xl font-extrabold text-slate-900 mb-6">
               NoteClean AI Studio
             </h2>
             
             {/* Mode Selector */}
             <div className="inline-flex bg-slate-200 p-1 rounded-xl mb-6 shadow-inner flex-wrap justify-center gap-1">
               <button
                 onClick={() => setMode(AppMode.CLEAN)}
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                   mode === AppMode.CLEAN 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Sparkles className="w-4 h-4" />
                 Remove Logo
               </button>
               <button
                 onClick={() => setMode(AppMode.CONVERT)}
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                   mode === AppMode.CONVERT 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Smartphone className="w-4 h-4" />
                 To Vertical
               </button>
               <button
                 onClick={() => setMode(AppMode.REMOVE_TEXT)}
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                   mode === AppMode.REMOVE_TEXT 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Eraser className="w-4 h-4" />
                 Remove Text
               </button>
               <button
                 onClick={() => setMode(AppMode.CUSTOMIZE_TEXT)}
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                   mode === AppMode.CUSTOMIZE_TEXT 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Type className="w-4 h-4" />
                 Customize Text
               </button>
             </div>

             <div className="max-w-2xl mx-auto mb-8">
                <p className="text-lg text-slate-600 mb-6">
                  {getModeDescription()}
                </p>

                {/* Input for Customize Text Mode */}
                {mode === AppMode.CUSTOMIZE_TEXT && (
                  <div className="mb-6 animate-fade-in text-left">
                    <label htmlFor="instruction" className="block text-sm font-medium text-slate-700 mb-2">
                       Customization Instructions
                    </label>
                    <textarea
                      id="instruction"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      placeholder="e.g. Change '2024 Report' to '2025 Summary', or 'Translate the headline to Spanish'..."
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                    />
                  </div>
                )}
             </div>
             
             <FileUpload 
               onFileSelect={handleFileSelect} 
               isProcessing={false} 
               modeText={getModeTitle()} 
             />
           </div>
        )}

        {status === ProcessingStatus.EXTRACTING && (
            <div className="mt-12">
                <FileUpload onFileSelect={() => {}} isProcessing={true} modeText="Processing" />
            </div>
        )}

        {status === ProcessingStatus.ERROR && (
             <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Processing Error</h3>
                <p className="text-red-700 mb-6">{error}</p>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-white border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Try Again
                </button>
             </div>
        )}

        {(status === ProcessingStatus.READY_TO_CLEAN || status === ProcessingStatus.CLEANING || status === ProcessingStatus.COMPLETED) && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isProcessing ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                    {isProcessing 
                      ? `Processing ${images.length} items...` 
                      : `${images.length} Items Processed`}
                 </div>
                 <p className="text-sm text-slate-500 hidden sm:block">
                    {mode === AppMode.CLEAN && 'Logo removal complete.'}
                    {mode === AppMode.CONVERT && 'Format conversion complete.'}
                    {mode === AppMode.REMOVE_TEXT && 'Text removal complete.'}
                    {mode === AppMode.CUSTOMIZE_TEXT && 'Text customization complete.'}
                 </p>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button 
                  onClick={handleReset}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                >
                   <Trash2 className="w-4 h-4" /> Start Over
                </button>
                
                {allCleaned ? (
                  <button 
                    onClick={handleDownloadAll}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm hover:shadow transition-all text-sm font-medium"
                  >
                     <Archive className="w-4 h-4" /> Download All (ZIP)
                  </button>
                ) : (
                  <>
                    {hasFailures && (
                        <button 
                            onClick={handleRetryFailed}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-all text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry Failed
                        </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  onClean={handleSingleItemRetry} 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} NoteClean AI. Powered by Google Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;