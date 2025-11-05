import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// Initialize PDF.js worker if not already done
const pdfjsLib = (window as any).pdfjsLib;
if (pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// --- HELPER FUNCTIONS & CONSTANTS ---
const getLS = (...keys: string[]): string => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return '';
};

const fmtEuro = (n: number | null | undefined): string => (n == null || isNaN(n)) ? '—' : ('€' + n.toFixed(2).replace('.', ','));

const normalizePackName = (p: string) => (p || '').replace(/\s*–\s*da\s*€[\d,.]+/,'');

const CUSTOM_APPS = [
    { id: 'girasole', name: 'Girasole' }, { id: 'ciliegio', name: 'Fiore di ciliegio rosa' },
    { id: 'ragno', name: 'Fiore ragno blu' }, { id: 'ibisco', name: 'Fiore di ibisco rosso' }
];

const laminaFilterMap: Record<string, string> = {
  "Argento": "grayscale(1) brightness(2.5) contrast(1.5)",
  "Oro": "grayscale(1) sepia(1) hue-rotate(-25deg) saturate(5) brightness(1.2) contrast(1.1)",
  "Blu": "grayscale(1) sepia(1) hue-rotate(180deg) saturate(8) brightness(0.7) contrast(1.5)",
  "Rosso": "grayscale(1) sepia(1) hue-rotate(320deg) saturate(7) brightness(0.9) contrast(1.2)",
  "Nero": "grayscale(1) brightness(0.1) contrast(1.5)",
};

const getTextureUrl = (finituraGroup?: string, variante?: string) => {
    if (!finituraGroup || !variante) return '';
    const group = finituraGroup.trim().toLowerCase().replace(/ /g, '-');
    const color = variante.trim().toLowerCase().replace(/ /g, '-');
    return `/textures/${group}-${color}.webp`;
};


interface FlipbookSheet {
  isFlipped: boolean; zIndex: number; isLeftEdgeHidden: boolean; isRightEdgeHidden: boolean;
  pageContent: {
    pageNumber: number; isBlank: boolean; imageUrl: string | null; isBw: boolean;
  };
}

interface Step6ReviewProps {
  thesisFile: File | null;
  frontispieceFile: File | null;
}

// --- MAIN COMPONENT ---
const Step6Review: React.FC<Step6ReviewProps> = ({ thesisFile, frontispieceFile }) => {
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  
  const [pageImageUrls, setPageImageUrls] = useState<(string | null)[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [frontispieceForCoverUrl, setFrontispieceForCoverUrl] = useState<string|null>(null);
  const [coverStyle, setCoverStyle] = useState<React.CSSProperties>({});
  const [laminaStyle, setLaminaStyle] = useState<React.CSSProperties>({});

  const flipSceneRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);

  // --- DATA LOADING & PREVIEW GENERATION ---
  useEffect(() => {
    const pageColorsStr = getLS('pageColors');
    const pageColors = pageColorsStr ? JSON.parse(pageColorsStr) : [];
    
    const hasFrontispiece = getLS('frontespizioInterno').toLowerCase() === 'sì';
    const thesisPages = parseInt(getLS('totalPages'), 10) || 0;
    
    const effectiveTotalPages = pageColors.length > 0 ? pageColors.length : thesisPages + (hasFrontispiece ? 1 : 0);

    const data = {
        totalPages: effectiveTotalPages,
        quantity: getLS('quantita', 'quantità') || '1',
        isDuplex: !!getLS('copieFronteRetro'),
        frontispiece: hasFrontispiece ? 'Sì' : 'No',
        paper: getLS('cartaInterna') || '—',
        bwPages: getLS('bnPages') || '0',
        colorPages: getLS('colorPages') || '0',
        pacchetto: normalizePackName(getLS('pacchetto')) || '—',
        rivestimento: getLS('rivestimentoGruppo') || '—',
        coloreCopertina: getLS('coloreCopertina') || '—',
        laminazione: getLS('laminazione') || '—',
        hasAngoli: getLS('optAngoli') === '1',
        finalTotal: parseFloat(getLS('finalTotal')) || 0,
        selectedApp: CUSTOM_APPS.find(app => getLS(`opt${app.name.split(' ')[0]}`) === '1')?.name || null,
        pageColors: pageColors.length > 0 ? pageColors : new Array(effectiveTotalPages).fill('color'),
    };
    setSummary(data);
  }, []);

  const generatePagePreviews = useCallback(async () => {
    const pageColorsStr = getLS('pageColors');
    const pageColors = pageColorsStr ? JSON.parse(pageColorsStr) : [];
    const hasFrontispiece = getLS('frontespizioInterno').toLowerCase() === 'sì';
    const thesisPages = parseInt(getLS('totalPages'), 10) || 0;
    const totalPages = pageColors.length > 0 ? pageColors.length : thesisPages + (hasFrontispiece ? 1 : 0);

    if (totalPages === 0 || (!thesisFile && !frontispieceFile)) return;

    setIsLoadingPages(true);
    if (!pdfjsLib) { console.error("PDF.js not loaded"); setIsLoadingPages(false); return; }

    const urls: (string | null)[] = new Array(totalPages).fill(null);
    let currentUrlIndex = 0;

    const renderPage = async (pdfDoc: any, pageNum: number): Promise<string | null> => {
        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                return canvas.toDataURL('image/jpeg', 0.85);
            }
            return null;
        } catch (error) { console.error(`Error rendering page ${pageNum}`, error); return null; }
    };

    if (hasFrontispiece && frontispieceFile) {
        const fileUrl = URL.createObjectURL(frontispieceFile);
        try {
            const pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
            const url = await renderPage(pdfDoc, 1);
            if (currentUrlIndex < totalPages) urls[currentUrlIndex++] = url;
        } catch (e) { console.error("Error processing frontispiece for flipbook", e); }
        finally { URL.revokeObjectURL(fileUrl); }
    }

    if (thesisFile) {
        const fileUrl = URL.createObjectURL(thesisFile);
        try {
            const pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
            const numPagesToProcess = Math.min(pdfDoc.numPages, totalPages - currentUrlIndex);
            
            for (let i = 1; i <= numPagesToProcess; i++) {
                const url = await renderPage(pdfDoc, i);
                if (currentUrlIndex < totalPages) urls[currentUrlIndex++] = url;
            }
        } catch (e) { console.error("Error processing thesis for flipbook", e); }
        finally { URL.revokeObjectURL(fileUrl); }
    }

    setPageImageUrls(urls);
    setIsLoadingPages(false);
  }, [thesisFile, frontispieceFile]);
  
  const generateCoverFrontispiecePreview = useCallback(async () => {
    if (!frontispieceFile) { setFrontispieceForCoverUrl(null); return; }
    if (!pdfjsLib) { console.error("PDF.js not loaded."); return; }
    
    const fileUrl = URL.createObjectURL(frontispieceFile);
    try {
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (context) {
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample a pixel more centrally to avoid edge artifacts (consistent with Step 4)
        const sampleIndex = (5 * canvas.width + 5) * 4;
        const bgR = data[sampleIndex];
        const bgG = data[sampleIndex + 1];
        const bgB = data[sampleIndex + 2];

        if (bgR > 200 && bgG > 200 && bgB > 200) { // Check for white-ish background
          const tolerance = 20;
          for (let i = 0; i < data.length; i += 4) {
            if (Math.abs(data[i] - bgR) < tolerance && Math.abs(data[i+1] - bgG) < tolerance && Math.abs(data[i+2] - bgB) < tolerance) {
              data[i + 3] = 0; // Make transparent
            }
          }
          context.putImageData(imageData, 0, 0);
        }
        setFrontispieceForCoverUrl(canvas.toDataURL('image/png'));
      }
    } catch (error) { console.error('Error rendering cover frontispiece:', error); setFrontispieceForCoverUrl(null); }
    finally { URL.revokeObjectURL(fileUrl); }
  }, [frontispieceFile]);


  // --- FLIPBOOK LOGIC ---
  const nextPage = useCallback(() => {
    if (!isCoverOpen) {
      setIsCoverOpen(true);
    } else {
      setCurrentPage(p => Math.min(p + 1, summary.totalPages));
    }
  }, [isCoverOpen, summary.totalPages]);

  const prevPage = useCallback(() => {
    if (isCoverOpen && currentPage === 0) {
      setIsCoverOpen(false);
    } else {
      setCurrentPage(p => Math.max(p - 1, 0));
    }
  }, [isCoverOpen, currentPage]);
  
  const openModal = () => {
    setCurrentPage(0);
    setIsCoverOpen(false);
    setIsModalOpen(true);

    // Generate previews if not already generated
    if (pageImageUrls.length === 0 && summary.totalPages > 0) generatePagePreviews();
    if (!frontispieceForCoverUrl) generateCoverFrontispiecePreview();

    // Set cover styles
    const finitura = getLS('rivestimentoGruppo');
    const variante = getLS('coloreCopertina');
    const lamina = getLS('laminazione');
    setCoverStyle({ backgroundImage: `url("${getTextureUrl(finitura, variante)}")` });
    setLaminaStyle({ filter: laminaFilterMap[lamina] || 'none' });
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      else if (e.key === 'ArrowLeft') prevPage();
      else if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, nextPage, prevPage]);

  const flipbookSheets = useMemo<FlipbookSheet[]>(() => {
    if (!summary.totalPages || !summary.pageColors) return [];
    return Array.from({ length: summary.totalPages }, (_, i) => ({
      isFlipped: i < currentPage,
      zIndex: (summary.totalPages - i) + 10,
      isLeftEdgeHidden: currentPage === 0 && i === 0,
      isRightEdgeHidden: currentPage === summary.totalPages && i === summary.totalPages - 1,
      pageContent: {
        pageNumber: i + 1,
        isBlank: !summary.isDuplex && i % 2 === 1,
        imageUrl: pageImageUrls[i] || null,
        isBw: summary.pageColors[i] === 'bw',
      }
    }));
  }, [summary.totalPages, summary.isDuplex, summary.pageColors, currentPage, pageImageUrls]);

  useEffect(() => {
      const scene = flipSceneRef.current;
      const spine = spineRef.current;
      if (!scene || !spine) return;
      scene.classList.remove('center-right', 'center-left');
      if (currentPage === 0) { scene.classList.add('center-right'); spine.style.visibility = 'hidden'; }
      else if (currentPage === summary.totalPages) { scene.classList.add('center-left'); spine.style.visibility = 'hidden'; }
      else { spine.style.visibility = 'visible'; }
  }, [currentPage, summary.totalPages]);
  
  return (
    <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Colonna sinistra */}
      <div className="lg:col-span-2">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Anteprima Finale</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Rivedi il layout completo della tua tesi. L’anteprima è indicativa della paginazione finale.
          </p>
          <div className="rounded-md overflow-hidden border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark">
            <div className="aspect-[16/9] w-full flex items-center justify-center">
              <span className="text-sm text-muted-light dark:text-muted-dark">L'anteprima si aprirà a schermo intero.</span>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={openModal} type="button" className="flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg hover:bg-primary/90 transition">
              <span>Apri anteprima a schermo intero</span>
            </button>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-sm">
            <p className="font-bold">Nota utile</p>
            <p>Questa anteprima serve per controllare impaginazione e margini. La qualità di stampa sarà superiore rispetto alla visualizzazione a schermo.</p>
          </div>
        </div>
      </div>

      {/* Colonna destra */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-8">
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button onClick={() => setIsSummaryExpanded(p => !p)} className="acc-header w-full flex items-center justify-between px-5 py-4 bg-gray-600 text-white hover:bg-gray-700">
                    <span className="text-base font-bold">Riepilogo della lavorazione</span>
                    <span className="material-symbols-outlined transition-transform" style={{transform: isSummaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)'}}>{isSummaryExpanded ? 'remove' : 'add'}</span>
                </button>
                {isSummaryExpanded && <div className="px-6 pb-6 pt-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine totali:</span><span className="font-medium">{summary.totalPages}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Quantità:</span><span className="font-medium">{summary.quantity}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Stampa fronte-retro:</span><span className="font-medium">{summary.isDuplex ? 'Sì' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Frontespizio interno:</span><span className="font-medium">{summary.frontispiece}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Carta (pagine interne):</span><span className="font-medium">{summary.paper}</span></div>
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine B/N:</span><span className="font-medium">{summary.bwPages}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine a Colori:</span><span className="font-medium">{summary.colorPages}</span></div>
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rilegatura:</span><span className="font-medium">Rigide</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pacchetto:</span><span className="font-medium">{summary.pacchetto}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rivestimento:</span><span className="font-medium">{summary.rivestimento}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore copertina:</span><span className="font-medium">{summary.coloreCopertina}</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore laminazione:</span><span className="font-medium">{summary.laminazione}</span></div>
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Capitelli:</span><span className="font-medium">Inclusi</span></div>
                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Angoli metallici:</span><span className="font-medium">{summary.hasAngoli ? 'Sì' : 'No'}</span></div>
                    {summary.selectedApp && <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Applicazione:</span><span className="font-medium">{summary.selectedApp}</span></div>}
                  </div>
                </div>}
            </div>

            <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Preventivo</h3>
                <div className="mb-3 flex items-center justify-between"><span className="text-sm text-muted-light dark:text-muted-dark">Quantità</span><span className="text-base font-semibold">{summary.quantity}</span></div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-light dark:text-muted-dark">Spedizione</span>
                  <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full text-xs">
                    <span className="material-symbols-outlined text-base">local_shipping</span>Spedizione gratis
                  </span>
                </div>
                <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Totale preventivo</span>
                  <span className="font-semibold">{fmtEuro(summary.finalTotal)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- FULLSCREEN FLIP MODAL --- */}
      {isModalOpen && <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/90" onClick={closeModal}></div>
        <div className="relative z-10 h-full w-full flex flex-col">
          <div className="z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-card-light/90 dark:bg-card-dark/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3"><span className="font-bold">Anteprima a schermo intero</span></div>
            <div className="flex items-center gap-2">
              <button onClick={prevPage} disabled={!isCoverOpen && currentPage === 0} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span><span className="hidden sm:inline">Indietro</span></button>
              <button onClick={nextPage} disabled={isCoverOpen && currentPage >= summary.totalPages} className="h-10 px-3 rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-1 disabled:opacity-50"><span className="hidden sm:inline">Avanti</span><span className="material-symbols-outlined">chevron_right</span></button>
              <button onClick={closeModal} className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center" aria-label="Chiudi"><span className="material-symbols-outlined">close</span></button>
            </div>
          </div>
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
            <style>{`.flip-scene{perspective:2500px;transition:transform .35s ease}.flip-scene.center-right{transform:translateX(-25%)}.flip-scene.center-left{transform:translateX(25%)}.flipbook{position:relative;height:85vh;width:auto;max-width:90vw;aspect-ratio:0.707 / 1;transform-style:preserve-3d;user-select:none}.sheet{position:absolute;top:0;left:50%;width:50%;height:100%;transform-origin:left center;transition:transform .8s ease,box-shadow .8s ease;box-shadow:0 10px 30px rgba(0,0,0,.10);background:#fff;border:1px solid rgba(0,0,0,.08);overflow:hidden;will-change:transform}.sheet.hide-left-edge{border-left-color:transparent}.sheet.hide-right-edge{border-right-color:transparent}.sheet .page{position:absolute;inset:0;padding:28px;display:flex;align-items:center;justify-content:center;color:#111827;background:linear-gradient(180deg,#fff,#fafafa)}.sheet .page.blank{background:repeating-linear-gradient(45deg,#fafafa,#fafafa 10px,#f5f5f5 10px,#f5f5f5 20px);color:#6b7280}.sheet .pagenum{position:absolute;bottom:10px;right:16px;font-size:12px;color:#6b7280}.sheet.flipped{transform:rotateY(-180deg);box-shadow:-12px 0 30px rgba(0,0,0,.08)}.spine{position:absolute;left:calc(50% - 1px);top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.05));z-index:30}.hit-left,.hit-right{position:absolute;top:0;bottom:0;width:18%;cursor:pointer;z-index:20}.hit-left{left:0}.hit-right{right:0}`}</style>
            
            {!isCoverOpen ? (
              <div 
                className="relative h-[85vh] aspect-[0.707/1] max-w-[90vw] bg-gray-800 rounded-md flex items-center justify-center p-4 border border-gray-700 overflow-hidden bg-cover bg-center shadow-2xl"
                style={coverStyle}
                >
                {frontispieceForCoverUrl ? (
                  <img 
                    src={frontispieceForCoverUrl} 
                    alt="Anteprima frontespizio laminato" 
                    className="absolute inset-0 w-full h-full object-contain p-8" 
                    style={laminaStyle}
                  />
                ) : (
                  <div className="text-white text-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Caricamento copertina...</div>
                )}
              </div>
            ) : isLoadingPages ? (
              <div className="text-white text-center flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="font-bold">Generazione anteprime in corso...</span>
              </div>
            ) : (
            <>
              <div ref={spineRef} className="spine"></div>
              <div ref={flipSceneRef} className="flip-scene z-10"><div className="flipbook">
                  {flipbookSheets.map((sheet, i) => (
                      <div key={i} className={`sheet ${sheet.isFlipped ? 'flipped' : ''} ${sheet.isLeftEdgeHidden ? 'hide-left-edge' : ''} ${sheet.isRightEdgeHidden ? 'hide-right-edge' : ''}`} style={{zIndex: sheet.zIndex}}>
                          <div className={`page ${sheet.pageContent.isBlank ? 'blank' : ''}`}>
                              {sheet.pageContent.isBlank ? (
                                  <div className="text-lg font-medium">Pagina bianca</div>
                              ) : sheet.pageContent.imageUrl ? (
                                  <img src={sheet.pageContent.imageUrl} alt={`Pagina ${sheet.pageContent.pageNumber}`} className="w-full h-full object-contain" style={{filter: sheet.pageContent.isBw ? 'grayscale(1)' : 'none'}} />
                              ) : (
                                  <div className="text-lg font-medium text-center">Anteprima non disponibile</div>
                              )}
                              <div className="pagenum">Pag. {sheet.pageContent.pageNumber}</div>
                          </div>
                      </div>
                  ))}
              </div></div>
              <div className="hit-left" onClick={prevPage}></div>
              <div className="hit-right" onClick={nextPage}></div>
            </>
            )}
          </div>
          <div className="z-30 px-4 sm:px-6 py-2 text-sm text-gray-200 bg-card-light/10 dark:bg-card-dark/10">
            <span>
              {!isCoverOpen 
                ? 'Copertina' 
                : `Pagina ${Math.min(Math.max(currentPage + 1, 1), summary.totalPages || 1)} / ${summary.totalPages || 0}`
              }
            </span>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default Step6Review;