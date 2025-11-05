import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Toast from '../Toast';

type PageColor = 'bw' | 'color';
type Conflict = { sheet: number; left: number; right: number; leftVal: PageColor; rightVal: PageColor; } | null;

// A pixel is considered "color" if the difference between its max and min RGB channels is above this threshold.
// This helps ignore anti-aliasing artifacts and slight off-white paper colors.
const COLOR_DETECTION_THRESHOLD = 20;

interface Step3PageColorsProps {
  onValidationChange: (isValid: boolean) => void;
  thesisFile: File | null;
  frontispieceFile: File | null;
  thesisPreviewUrl: string | null;
}

const getLS = (...keys: string[]): string => {
  for (const k of keys) { const v = localStorage.getItem(k); if (v) return v; }
  return '';
};

const fmtEuro = (n: number | null | undefined): string => (n == null || isNaN(n)) ? '—' : ('€' + n.toFixed(2).replace('.', ','));

// Helper to display page numbers in a compact format (e.g., "1-3, 5, 8-10")
const compressPageNumbers = (pageIndices: number[]): string => {
  if (!pageIndices || pageIndices.length === 0) {
    return 'Nessuna';
  }
  const pageNumbers = pageIndices.map(i => i + 1).sort((a, b) => a - b);
  const ranges: (string | number)[] = [];
  let startOfRange = pageNumbers[0];

  for (let i = 1; i <= pageNumbers.length; i++) {
    if (i === pageNumbers.length || pageNumbers[i] !== pageNumbers[i - 1] + 1) {
      const endOfRange = pageNumbers[i - 1];
      if (startOfRange === endOfRange) {
        ranges.push(startOfRange);
      } else {
        ranges.push(`${startOfRange}-${endOfRange}`);
      }
      if (i < pageNumbers.length) {
        startOfRange = pageNumbers[i];
      }
    }
  }
  return ranges.join(', ');
};

// Skeleton component for loading state
const PageCardSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        <div className="mt-3 flex justify-center gap-2">
            <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
    </div>
);


const Step3PageColors: React.FC<Step3PageColorsProps> = ({ onValidationChange, thesisFile, frontispieceFile, thesisPreviewUrl }) => {
  const [pageColors, setPageColors] = useState<PageColor[]>([]);
  const [conflict, setConflict] = useState<Conflict>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  const [pagePreviews, setPagePreviews] = useState<(string | null)[]>([]);
  const [frontispiecePreview, setFrontispiecePreview] = useState<string | null>(null);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);
  const [isDetectingColors, setIsDetectingColors] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read latest config from localStorage on every render to avoid stale state
  const totalPages = parseInt(getLS('totalPages', 'pagineTotali'), 10) || 0;
  const isDuplex = !!getLS('copieFronteRetro', 'fronteRetro', 'copieFD');
  const frontespizioInterno = getLS('frontespizioInterno', 'frontespizio') || '—';
  const paper = getLS('cartaInterna', 'paperType', 'cartaPagine') || '—';
  const quantity = parseInt(getLS('quantita', 'quantità', 'orderQty', 'qty', 'copie', 'copies', 'numeroCopie', 'pvQty'), 10) || 1;
  const hasFrontispiece = frontespizioInterno.toLowerCase().startsWith('s');
  const effectiveTotalPages = totalPages + (hasFrontispiece ? 1 : 0);

  const prices = useMemo(() => {
    let bnPrice: number | null = parseFloat(getLS('bnPrice'));
    let colorPrice: number | null = parseFloat(getLS('colorPrice'));

    if (isNaN(bnPrice) || isNaN(colorPrice)) {
      const pprLower = paper.toLowerCase();
      if (pprLower.includes('80'))  { bnPrice = 0.10; colorPrice = 0.35; }
      else if (pprLower.includes('100')) { bnPrice = 0.20; colorPrice = 0.50; }
      else if (pprLower.includes('120')) { bnPrice = 0.20; colorPrice = 0.55; }
      else { bnPrice = null; colorPrice = null; }
    }
    return { bnP: bnPrice, colP: colorPrice };
  }, [paper]);


    // Function to analyze a canvas for color
    const analyzeCanvasForColor = (context: CanvasRenderingContext2D, width: number, height: number): PageColor => {
        const imageData = context.getImageData(0, 0, width, height).data;
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max - min > COLOR_DETECTION_THRESHOLD) {
                return 'color'; // Found a color pixel, no need to check further
            }
        }
        return 'bw'; // No color pixels found
    };

    const runAutoDetection = useCallback(async (isInitialLoad = false) => {
      if (isInitialLoad) {
          setIsLoadingPreviews(true);
      } else {
          setIsDetectingColors(true);
      }
      
      const pdfjsLib = (window as any).pdfjsLib;

      if (!pdfjsLib) {
          console.error("PDF.js is not loaded.");
          setIsLoadingPreviews(false);
          setIsDetectingColors(false);
          return;
      }

      const renderPage = async (pdfDoc: any, pageNum: number): Promise<{ previewUrl: string | null, detectedColor: PageColor }> => {
          try {
              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d', { willReadFrequently: true });
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                  await page.render({ canvasContext: context, viewport: viewport }).promise;
                  const detectedColor = analyzeCanvasForColor(context, canvas.width, canvas.height);
                  const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
                  return { previewUrl, detectedColor };
              }
              return { previewUrl: null, detectedColor: 'bw' };
          } catch (error) {
              console.error(`Error rendering page ${pageNum}`, error);
              return { previewUrl: null, detectedColor: 'bw' };
          }
      };
      
      const initialColors = new Array(effectiveTotalPages).fill('bw');

      if (hasFrontispiece && frontispieceFile) {
          const fileUrl = URL.createObjectURL(frontispieceFile);
          try {
              const pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
              const { previewUrl, detectedColor } = await renderPage(pdfDoc, 1);
              if (isInitialLoad) setFrontispiecePreview(previewUrl);
              initialColors[0] = detectedColor;
          } catch (e) { console.error("Failed to process frontispiece file", e); } 
          finally { URL.revokeObjectURL(fileUrl); }
      }
      
      if (thesisFile) {
          const fileUrl = URL.createObjectURL(thesisFile);
          try {
              const pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
              const numPagesToRender = Math.min(totalPages, pdfDoc.numPages);
              const promises = Array.from({ length: numPagesToRender }, (_, i) => renderPage(pdfDoc, i + 1));
              const results = await Promise.all(promises);
              
              if(isInitialLoad) {
                const previews = results.map(r => r.previewUrl);
                setPagePreviews(previews);
              }

              const detectedColors = results.map(r => r.detectedColor);
              const startIndex = hasFrontispiece ? 1 : 0;
               for (let i = 0; i < detectedColors.length; i++) {
                  if ((i + startIndex) < effectiveTotalPages) {
                      initialColors[i + startIndex] = detectedColors[i];
                  }
              }

          } catch (e) {
              console.error("Failed to process thesis file", e);
              if(isInitialLoad) setPagePreviews(new Array(totalPages).fill(null));
          } finally { URL.revokeObjectURL(fileUrl); }
      } else if (isInitialLoad) {
          setPagePreviews(new Array(totalPages).fill(null));
      }

      setPageColors(initialColors);
      if (isInitialLoad) setIsLoadingPreviews(false);
      setIsDetectingColors(false);
      setToastMessage("Rilevamento automatico del colore completato.");
  }, [thesisFile, frontispieceFile, totalPages, effectiveTotalPages, hasFrontispiece]);


  useEffect(() => {
    // This effect re-runs if the total number of pages changes,
    // ensuring the preview generation and color detection logic stays in sync
    // when the user navigates back and forth between steps.
    runAutoDetection(true);
  }, [runAutoDetection]);


  useEffect(() => {
    if (pageColors.length === 0 || pageColors.length !== effectiveTotalPages) return;
    
    localStorage.setItem('pageColors', JSON.stringify(pageColors));
    const bw = pageColors.filter(c => c === 'bw').length;
    const color = pageColors.length - bw;
    localStorage.setItem('bnPages', String(bw));
    localStorage.setItem('colorPages', String(color));

    let newConflict: Conflict = null;
    if (isDuplex) {
      for (let left = 1; left <= effectiveTotalPages; left += 2) {
        const right = left + 1;
        if (right > effectiveTotalPages) break;
        if (pageColors[left - 1] !== pageColors[right - 1]) {
          const sheet = (left + 1) / 2;
          newConflict = { sheet, left, right, leftVal: pageColors[left - 1], rightVal: pageColors[right - 1] };
          break;
        }
      }
    }
    setConflict(newConflict);
    onValidationChange(!newConflict);

  }, [pageColors, isDuplex, effectiveTotalPages, onValidationChange]);


  const { bwCount, colorCount, costPerCopy, totalCost, activeQuickAction, bwPagesStr, colorPagesStr } = useMemo(() => {
    const bwIndices: number[] = [];
    const colorIndices: number[] = [];
    pageColors.forEach((c, i) => {
      if (c === 'bw') bwIndices.push(i);
      else colorIndices.push(i);
    });

    const bw = bwIndices.length;
    const color = colorIndices.length;
    const cost = (prices.bnP ?? 0) * bw + (prices.colP ?? 0) * color;
    
    let quickAction: 'bw' | 'color' | null = null;
    if (color === 0 && pageColors.length > 0) quickAction = 'bw';
    else if (bw === 0 && pageColors.length > 0) quickAction = 'color';

    return { 
      bwCount: bw, 
      colorCount: color,
      bwPagesStr: compressPageNumbers(bwIndices),
      colorPagesStr: compressPageNumbers(colorIndices),
      costPerCopy: cost, 
      totalCost: cost * quantity, 
      activeQuickAction: quickAction 
    };
  }, [pageColors, prices, quantity]);

  const handlePageColorChange = useCallback((pageIndex: number, color: PageColor) => {
    setPageColors(currentColors => {
      const newColors = [...currentColors];
      newColors[pageIndex] = color;
      return newColors;
    });
  }, []);

  const handleResolveConflict = useCallback((resolution: PageColor) => {
    if (!conflict) return;
    setPageColors(currentColors => {
      const newColors = [...currentColors];
      newColors[conflict.left - 1] = resolution;
      newColors[conflict.right - 1] = resolution;
      return newColors;
    });
  }, [conflict]);

  const handleSetAll = useCallback((color: PageColor) => {
    setPageColors(new Array(effectiveTotalPages).fill(color));
  }, [effectiveTotalPages]);

  return (
    <>
    {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}
    <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Configurazione stampa</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Il nostro sistema ha analizzato ogni pagina per ottimizzare i costi di stampa. Controlla il risultato e apporta le modifiche che desideri.
          </p>
          <div className="space-y-6">
            {conflict && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined mt-0.5">warning</span>
                  <div className="flex-1">
                    <p className="text-sm leading-5">Hai selezionato colori diversi per il foglio {conflict.sheet} (pagg. {conflict.left}–{conflict.right}): {conflict.leftVal === 'bw' ? 'B/N' : 'Colore'} e {conflict.rightVal === 'bw' ? 'B/N' : 'Colore'}. Scegli come uniformarle.</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button onClick={() => handleResolveConflict('bw')} className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                        Entrambe B/N
                      </button>
                      <button onClick={() => handleResolveConflict('color')} className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">
                        Entrambe Colore
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t border-subtle-light dark:border-subtle-dark pt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Azioni Rapide</h3>
              <div className="grid grid-cols-3 gap-4">
                 <button
                    onClick={() => runAutoDetection(false)}
                    disabled={isDetectingColors || isLoadingPreviews}
                    className="btn-quick flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-colors border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-wait"
                    >
                    {isDetectingColors ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Rilevamento...
                        </>
                    ) : 'Automatico'}
                </button>
                <button 
                  onClick={() => handleSetAll('bw')} 
                  disabled={isDetectingColors || isLoadingPreviews}
                  className="btn-quick flex-1 px-6 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50" aria-pressed={activeQuickAction === 'bw'}>
                  In Bianco e Nero
                </button>
                <button 
                  onClick={() => handleSetAll('color')} 
                  disabled={isDetectingColors || isLoadingPreviews}
                  className="btn-quick flex-1 px-6 py-3 text-sm font-bold text-primary bg-primary/20 dark:bg-primary/30 rounded-lg hover:bg-primary/25 dark:hover:bg-primary/40 transition-colors disabled:opacity-50" aria-pressed={activeQuickAction === 'color'}>
                  A Colori
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {isLoadingPreviews 
                ? Array.from({ length: effectiveTotalPages }).map((_, i) => <PageCardSkeleton key={i} />)
                : pageColors.map((color, i) => {
                    const pageNum = i + 1;
                    const isConflicting = conflict && (pageNum === conflict.left || pageNum === conflict.right);
                    
                    let previewUrl: string | null = null;
                    let isFrontispieceCard = false;

                    if (hasFrontispiece) {
                        if (pageNum === 1) { // This is the first card, dedicated to the frontispiece
                            previewUrl = frontispiecePreview;
                            isFrontispieceCard = true;
                        } else { // Subsequent cards show thesis pages, offset by 1
                            const thesisPageIndex = i - 1; // pageNum 2 -> index 0, pageNum 3 -> index 1
                            if (thesisPageIndex < pagePreviews.length) {
                                previewUrl = pagePreviews[thesisPageIndex];
                            }
                        }
                    } else { // No frontispiece, direct mapping
                        const thesisPageIndex = i;
                        if (thesisPageIndex < pagePreviews.length) {
                            previewUrl = pagePreviews[thesisPageIndex];
                        }
                    }

                    const cardBgClass = color === 'color' ? '' : 'bg-subtle-light dark:bg-subtle-dark';

                    return (
                      <div key={pageNum} className={`group ${color === 'bw' ? 'mode-bw' : 'mode-color'} ${isConflicting ? 'conflict' : ''}`}>
                        <div className={`relative aspect-[3/4] rounded-lg page-card ${cardBgClass}`}>
                          {previewUrl ? (
                            <img src={previewUrl} alt={`Anteprima pagina ${pageNum}`} className="page-image absolute inset-0 w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-light dark:text-muted-dark"><span className="material-symbols-outlined">broken_image</span></div>
                          )}
                          <div className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-medium rounded bg-white/85 backdrop-blur border border-subtle-light shadow-sm">Pag. {pageNum}</div>
                          {isFrontispieceCard && <div className="frontespizio-badge">Frontespizio interno</div>}
                        </div>
                        <div className="mt-3 flex justify-center gap-2">
                          <label className="cursor-pointer">
                            <input className="sr-only peer" name={`page-color-${pageNum}`} type="radio" value="bw" checked={color === 'bw'} onChange={() => handlePageColorChange(i, 'bw')} />
                            <div className="px-3 py-1 text-xs font-medium rounded-full choice-pill">B/N</div>
                          </label>
                          <label className="cursor-pointer">
                            <input className="sr-only peer" name={`page-color-${pageNum}`} type="radio" value="color" checked={color === 'color'} onChange={() => handlePageColorChange(i, 'color')} />
                            <div className="px-3 py-1 text-xs font-medium rounded-full choice-pill">Colore</div>
                          </label>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </div>
      <div className="lg-col-span-1">
        <div className="sticky top-24 space-y-8">
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button onClick={() => setIsSummaryExpanded(prev => !prev)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-600 text-white hover:bg-gray-700 transition-colors" aria-expanded={isSummaryExpanded}>
              <span className="text-base font-bold">Riepilogo della lavorazione</span>
              <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>{isSummaryExpanded ? 'remove' : 'add'}</span>
            </button>
            {isSummaryExpanded && (
              <div className="px-6 pb-6 pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine totali:</span><span className="font-medium">{effectiveTotalPages}</span></div>
                  {isDuplex && <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Stampa fronte-retro:</span><span className="font-medium">{getLS('copieFronteRetro') || 'Sì'}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Frontespizio interno:</span><span className="font-medium">{frontespizioInterno}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Carta (pagine interne):</span><span className="font-medium">{paper}</span></div>
                  <div className="h-px bg-subtle-light dark:bg-subtle-dark my-2"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-light dark:text-muted-dark pt-0.5">Pagine B/N ({bwCount}):</span>
                    <span className="font-medium text-right break-all pl-2">{bwPagesStr}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-light dark:text-muted-dark pt-0.5">Pagine a Colori ({colorCount}):</span>
                    <span className="font-medium text-right break-all pl-2">{colorPagesStr}</span>
                  </div>
                  <div className="flex items-center justify-between"><span className="text-muted-light dark:text-muted-dark">Costo stimato (per copia):</span><span className="font-semibold">{fmtEuro(costPerCopy)}</span></div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Preventivo</h3>
            <div className="mb-3 flex items-center justify-between"><span className="text-sm text-muted-light dark:text-muted-dark">Quantità</span><span className="text-base font-semibold">{quantity}</span></div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-light dark:text-muted-dark">Spedizione</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-800/30 dark:text-green-200">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                Spedizione gratis
              </span>
            </div>
            <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
            <div className="flex items-center justify-between text-base"><span className="font-semibold">Totale preventivo</span><span className="font-semibold">{fmtEuro(totalCost)}</span></div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Step3PageColors;