import React, { useState, useRef, useEffect } from 'react';

// Initialize PDF.js worker
const pdfjsLib = (window as any).pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface Step1UploadProps {
  thesisFile: File | null;
  frontispieceFile: File | null;
  setThesisFile: (file: File | null) => void;
  setFrontispieceFile: (file: File | null) => void;
  thesisPreviewUrl: string | null;
  setThesisPreviewUrl: (url: string | null) => void;
  setTotalPages: (pages: number) => void;
}

const Step1Upload: React.FC<Step1UploadProps> = ({ thesisFile, frontispieceFile, setThesisFile, setFrontispieceFile, thesisPreviewUrl, setThesisPreviewUrl, setTotalPages }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingFrontispiece, setIsDraggingFrontispiece] = useState(false);
  const [isLoadingFrontispiece, setIsLoadingFrontispiece] = useState(false);
  const [frontispiecePreviewUrl, setFrontispiecePreviewUrl] = useState<string | null>(null);
  const frontispieceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thesisFile && !thesisPreviewUrl) {
      generatePdfPreview(thesisFile, setThesisPreviewUrl, setIsLoading, handleRemoveFile, setTotalPages);
    }
  }, [thesisFile, thesisPreviewUrl]);

  useEffect(() => {
    if (frontispieceFile && !frontispiecePreviewUrl) {
      generatePdfPreview(frontispieceFile, setFrontispiecePreviewUrl, setIsLoadingFrontispiece, handleRemoveFrontispieceFile);
    }
  }, [frontispieceFile, frontispiecePreviewUrl]);


  const generatePdfPreview = async (
    fileToPreview: File, 
    setPreviewUrl: (url: string | null) => void, 
    setIsLoadingState: React.Dispatch<React.SetStateAction<boolean>>, 
    onRemove: () => void,
    setPages?: (pages: number) => void,
  ) => {
    if (!pdfjsLib) {
      console.error("PDF.js is not loaded.");
      setIsLoadingState(false);
      return;
    }
    setIsLoadingState(true);
    const fileUrl = URL.createObjectURL(fileToPreview);
    try {
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      
      if (setPages) {
        setPages(pdf.numPages);
      }

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        setPreviewUrl(canvas.toDataURL('image/png'));
      }
    } catch (error) {
      console.error('Error rendering PDF preview:', error);
      alert("Impossibile generare l'anteprima per questo PDF.");
      onRemove(); // Reset on error
    } finally {
      URL.revokeObjectURL(fileUrl);
      setIsLoadingState(false);
    }
  };

  const handleFileSelect = (selectedFile: File | undefined | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setThesisFile(selectedFile);
    } else if (selectedFile) {
      alert('Per favore, seleziona un file PDF.');
    }
  };

  const handleRemoveFile = () => {
    setThesisFile(null);
    setThesisPreviewUrl(null);
    setTotalPages(0);
    setIsLoading(false);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); if (!thesisFile) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (!thesisFile) handleFileSelect(e.dataTransfer.files[0]);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };
  const onUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- Frontispiece Handlers ---
  const handleFrontispieceFileSelect = (selectedFile: File | undefined | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFrontispieceFile(selectedFile);
    } else if (selectedFile) {
        alert('Per favore, seleziona un file PDF.');
    }
  };

  const handleRemoveFrontispieceFile = () => {
    setFrontispieceFile(null);
    setFrontispiecePreviewUrl(null);
    setIsLoadingFrontispiece(false);
    if(frontispieceFileInputRef.current) {
      frontispieceFileInputRef.current.value = '';
    }
  };

  const onDragEnterFrontispiece = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); if (!frontispieceFile) setIsDraggingFrontispiece(true);
  };
  const onDragLeaveFrontispiece = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingFrontispiece(false);
  };
  const onDragOverFrontispiece = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  };
  const onDropFrontispiece = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingFrontispiece(false); if (!frontispieceFile) handleFrontispieceFileSelect(e.dataTransfer.files[0]);
  };
  const onFrontispieceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFrontispieceFileSelect(e.target.files?.[0]);
  };
  const onUploadFrontispieceButtonClick = () => {
    frontispieceFileInputRef.current?.click();
  };


  const renderFrontispieceUploader = () => {
    if (isLoadingFrontispiece) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-lg min-h-[300px] border-2 border-dashed border-slate-300 dark:border-slate-700 w-full">
                <p className="text-lg font-bold mb-4">Caricamento...</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
            </div>
        );
    }

    if (frontispieceFile && frontispiecePreviewUrl) {
        return (
            <div className="flex flex-col items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg w-full h-full">
                <img src={frontispiecePreviewUrl} alt="Anteprima frontespizio" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md" />
                <div className="text-center mt-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{frontispieceFile.name}</p>
                    <button onClick={handleRemoveFrontispieceFile} className="mt-2 text-sm text-primary hover:underline">
                        Rimuovi file
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative block w-full border-2 border-dashed border-slate-300 dark:border-slate-700 text-center transition-colors p-8 rounded-lg ${isDraggingFrontispiece ? 'border-primary/50' : 'hover:border-primary/50 dark:hover:border-primary/50'}`}
            onDragEnter={onDragEnterFrontispiece} onDragLeave={onDragLeaveFrontispiece} onDragOver={onDragOverFrontispiece} onDrop={onDropFrontispiece}
        >
            <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">upload_file</span>
                <p className="text-lg font-bold">Carica il file del Frontespizio</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Trascina e rilascia il PDF o clicca per selezionarlo.</p>
                <button type="button" onClick={onUploadFrontispieceButtonClick} className="mt-4 flex items-center justify-center rounded-lg h-10 px-5 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
                    <span className="truncate">Carica Frontespizio</span>
                </button>
            </div>
            <input ref={frontispieceFileInputRef} onChange={onFrontispieceFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" type="file" accept="application/pdf" aria-hidden="true" />
        </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg min-h-[300px]">
          <p className="text-lg font-bold mb-4">Caricamento in corso...</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      );
    }

    if (thesisFile && thesisPreviewUrl) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Column: Main Thesis Preview */}
            <div className="flex flex-col items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg h-full">
                <img src={thesisPreviewUrl} alt="Anteprima PDF" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md" />
                <div className="text-center mt-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{thesisFile.name}</p>
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="mt-2 text-sm text-primary hover:underline"
                    >
                        Rimuovi file
                    </button>
                </div>
            </div>
            {/* Right Column: Frontispiece Uploader */}
            <div className="flex flex-col items-center w-full">
                 {renderFrontispieceUploader()}
            </div>
        </div>
      );
    }

    return (
       <div 
        className={`relative block w-full border-2 border-dashed border-slate-300 dark:border-slate-700 text-center transition-colors p-8 rounded-lg ${isDragging ? 'border-primary/50' : 'hover:border-primary/50 dark:hover:border-primary/50'}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">upload_file</span>
          <p className="text-lg font-bold">Carica il file principale della tua Tesi</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trascina e rilascia il file PDF o clicca per selezionarlo.</p>
          <button 
            type="button"
            onClick={onUploadButtonClick}
            className="mt-4 flex items-center justify-center rounded-lg h-10 px-5 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
            <span className="truncate">Carica Tesi</span>
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400 h-5">
            Dimensione massima del file: 100MB
          </p>
        </div>
        <input 
          ref={fileInputRef}
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          type="file"
          accept="application/pdf"
          aria-hidden="true"
        />
      </div>
    );
  };


  return (
    <div className="max-w-5xl mx-auto">
        <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-sm">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6 text-foreground-light dark:text-foreground-dark">Carica la tua tesi</h2>
            <div className="space-y-6">
            <p className="text-lg text-slate-600 dark:text-slate-400">Per caricare il documento della tua tesi in formato PDF, segui attentamente queste istruzioni per garantire che il file venga stampato correttamente sulle pagine interne della rilegatura scelta. Accettiamo esclusivamente file PDF per assicurare una formattazione e impaginazione precise sia nell'anteprima che nella stampa finale.</p>
            
            {renderContent()}

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-sm">
                <p className="font-bold">Suggerimento</p>
                <p>Se il frontespizio contiene numeri di pagina o loghi di bassa qualità, non preoccuparti. Prima della stampa, i nostri grafici rimuoveranno i numeri di pagina e sostituiranno i loghi con versioni ad alta risoluzione.</p>
            </div>
            </div>
        </div>
    </div>
  );
};

export default Step1Upload;