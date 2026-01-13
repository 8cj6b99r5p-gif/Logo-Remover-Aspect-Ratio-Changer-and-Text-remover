import { ExtractedImage } from '../types';
import JSZip from 'jszip';

// Declare global PDFJS lib loaded via script tag
declare const pdfjsLib: any;

export const extractImagesFromPdf = async (file: File): Promise<ExtractedImage[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const extractedImages: ExtractedImage[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High res for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        extractedImages.push({
          id: `page-${i}-${Date.now()}`,
          originalUrl: imageUrl,
          status: 'pending',
          pageIndex: i
        });
      }

      resolve(extractedImages);
    } catch (error) {
      console.error("PDF Processing Error:", error);
      reject(error);
    }
  });
};

export const processImageFiles = async (files: File[]): Promise<ExtractedImage[]> => {
  const promises = files.map((file, index) => {
    return new Promise<ExtractedImage>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          if (!e.target?.result) {
              reject(new Error(`Failed to read image file: ${file.name}`));
              return;
          }

          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                  reject(new Error("Failed to create canvas context"));
                  return;
              }

              // Max dimension to ensure API compatibility and speed
              const MAX_DIMENSION = 1536;
              let width = img.width;
              let height = img.height;

              if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                  if (width > height) {
                      height = (height / width) * MAX_DIMENSION;
                      width = MAX_DIMENSION;
                  } else {
                      width = (width / height) * MAX_DIMENSION;
                      height = MAX_DIMENSION;
                  }
              }

              canvas.width = width;
              canvas.height = height;
              
              // White background for transparent PNGs
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              
              ctx.drawImage(img, 0, 0, width, height);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              
              resolve({
                  id: `img-${index}-${Date.now()}`,
                  originalUrl: dataUrl,
                  status: 'pending',
                  pageIndex: index + 1
              });
          };
          
          img.onerror = () => reject(new Error("Failed to load image structure"));
          img.src = e.target.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  });

  return Promise.all(promises);
};

export const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAllImagesAsZip = async (images: ExtractedImage[]) => {
  const zip = new JSZip();
  const folder = zip.folder("processed_images");
  
  if (!folder) return;

  images.forEach((img) => {
    if (img.cleanedUrl) {
      // Remove data:image/jpeg;base64, prefix
      const base64Data = img.cleanedUrl.split(',')[1];
      const ext = img.cleanedUrl.substring(img.cleanedUrl.indexOf('/') + 1, img.cleanedUrl.indexOf(';'));
      folder.file(`image-${img.pageIndex}.${ext}`, base64Data, { base64: true });
    }
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  downloadImage(url, "processed-images.zip");
  URL.revokeObjectURL(url);
};