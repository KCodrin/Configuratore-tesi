import React, { useState, useEffect, useMemo, useRef } from 'react';

// Initialize PDF.js worker
const pdfjsLib = (window as any).pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}


// --- DATA & CONSTANTS ---

const RIGIDE_DATA: Record<string, Record<string, string[]>> = {
  "Pacchetto Base – da €18,50": {
    "Metallic": ["White Pearl", "Aluminium", "Quartz", "Azzurra"],
    "Prestige": ["Dark Blue", "Dark Green", "Bordeaux", "Black"]
  },
  "Pacchetto Premium – da €22,50": {
    "Stile": ["Bordeaux", "Dark Blue", "Green", "Red"]
  },
  "Pacchetto Gold – da €29,50": {
    "Leather": ["Red", "Dark Blue", "Bordeaux", "Petrolio", "Black", "Dark Green", "Glicine"],
    "Termoviranti": ["Purple Pink", "White Ice", "Dark Blue", "Watermelon", "Giallo", "Giallo Zafferano", "Celeste", "Blue Sky", "Fucsia"]
  }
};
const LAMINA_COLORS = ["Argento", "Oro", "Blu", "Rosso", "Nero"];
const packageKeys = Object.keys(RIGIDE_DATA);

// --- HELPER FUNCTIONS ---

const getLS = (...keys: string[]): string => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return '';
};

const priceFromLabel = (label: string): string | null => {
  const match = (label || '').match(/€[\d,.]+/);
  return match ? match[0] : null;
};

const parsePrice = (label: string): number => {
    const match = (label || '').match(/€([\d,.]+)/);
    if (!match || !match[1]) return 0;
    return parseFloat(match[1].replace(',', '.'));
};

const getDiscountPercentage = (quantity: number): number => {
    if (quantity <= 1) return 0;
    if (quantity === 2) return 0.02; // 2%
    if (quantity >= 3 && quantity <= 4) return 0.03; // 3%
    if (quantity >= 5 && quantity <= 7) return 0.05; // 5%
    if (quantity >= 8 && quantity <= 10) return 0.10; // 10%
    if (quantity > 10) return 0.25; // 25%
    return 0;
};

const fmtEuro = (n: number | null | undefined): string => (n == null || isNaN(n)) ? '—' : ('€' + n.toFixed(2).replace('.', ','));

const normalizePackName = (p: string) => (p || '').replace(/\s*–\s*da\s*€[\d,.]+/,'');

const colorClassMap: Record<string, string> = {
  "Black": "bg-gray-900", "Nero": "bg-gray-900", "Dark Blue": "bg-blue-900", "Blu": "bg-blue-600", "Blue": "bg-blue-600", "Blu Royal": "bg-blue-700",
  "Azzurra": "bg-cyan-400", "Celeste": "bg-sky-400", "Blue Sky": "bg-sky-300", "Azzurro Cielo": "bg-sky-300", "Azzurro Carta da Zucchero": "bg-cyan-700",
  "Red": "bg-red-600", "Rosso": "bg-red-600", "Watermelon": "bg-rose-500", "Fucsia": "bg-fuchsia-500", "Purple Pink": "bg-purple-500", "Rosa": "bg-pink-400",
  "Giallo": "bg-yellow-400", "Giallo Zafferano": "bg-amber-400", "Beige": "bg-amber-200",
  "Dark Green": "bg-green-800", "Verde": "bg-green-600", "Green": "bg-green-600", "Bordeaux": "bg-red-800", "Glicine": "bg-violet-300",
  "White Pearl": "bg-slate-100", "White Ice": "bg-slate-100", "Quartz": "bg-zinc-300", "Aluminium": "bg-gray-400", "Petrolio": "bg-teal-700",
  "Argento": "bg-gray-300", "Oro": "bg-yellow-500"
};
const getColorClass = (name: string): string => colorClassMap[name] || "bg-gray-300";

const laminaFilterMap: Record<string, string> = {
  "Argento": "grayscale(1) brightness(2.5) contrast(1.5)",
  "Oro": "grayscale(1) sepia(1) hue-rotate(-25deg) saturate(5) brightness(1.2) contrast(1.1)",
  "Blu": "grayscale(1) sepia(1) hue-rotate(180deg) saturate(8) brightness(0.7) contrast(1.5)",
  "Rosso": "grayscale(1) sepia(1) hue-rotate(320deg) saturate(7) brightness(0.9) contrast(1.2)",
  "Nero": "grayscale(1) brightness(0.1) contrast(1.5)",
};


// --- UI SUB-COMPONENTS ---

interface CardOptionProps {
  name: string; value: string; groupName: string; subtitle?: string; priceBadge?: string | null; checked: boolean; onChange: (value: string) => void;
}
const CardOption: React.FC<CardOptionProps> = ({ name, value, groupName, subtitle, priceBadge, checked, onChange }) => (
  <label className={`flex items-center p-4 rounded-md border cursor-pointer transition-all ${checked ? 'has-checked border-primary bg-primary/5' : 'border-subtle-light dark:border-subtle-dark'}`}>
    <input type="radio" name={groupName} value={value} checked={checked} onChange={() => onChange(value)} className="h-5 w-5 text-primary bg-transparent focus:ring-primary focus:ring-offset-0"/>
    <div className="ml-4 w-full">
      <p className="font-medium text-gray-900 dark:text-white flex items-center">{name}{priceBadge && (<span className="ml-2 inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded bg-primary/10 text-primary">{priceBadge}</span>)}</p>
      {subtitle && <p className="text-sm text-muted-light dark:text-muted-dark">{subtitle}</p>}
    </div>
  </label>
);

interface SwatchOptionProps {
  label: string; groupName: string; checked: boolean; onChange: (value: string) => void;
}
const SwatchOption: React.FC<SwatchOptionProps> = ({ label, groupName, checked, onChange }) => (
  <label className="cursor-pointer flex flex-col items-center gap-2">
    <input type="radio" name={groupName} value={label} checked={checked} onChange={() => onChange(label)} className="sr-only peer"/>
    <div className={`h-10 w-10 rounded-full border-2 border-white ring-1 ring-gray-300 peer-checked:ring-4 peer-checked:ring-primary/40 peer-checked:border-primary ${getColorClass(label)}`}></div>
    <div className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight">{label}</div>
  </label>
);


// --- MAIN COMPONENT ---
interface Step4BindingProps {
  frontispieceFile: File | null;
}

const Step4Binding: React.FC<Step4BindingProps> = ({ frontispieceFile }) => {
  // --- STATE ---
  const [selectedPacchetto, setSelectedPacchetto] = useState<string>(packageKeys[0]);
  const [selectedFinituraGroup, setSelectedFinituraGroup] = useState<string>('');
  const [selectedVariante, setSelectedVariante] = useState<string>('');
  const [selectedLamina, setSelectedLamina] = useState<string>(LAMINA_COLORS[0]);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [frontispiecePreviewUrl, setFrontispiecePreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // --- DERIVED STATE & MEMO ---

  const finituraGroups = useMemo(() => {
    return selectedPacchetto ? Object.keys(RIGIDE_DATA[selectedPacchetto] || {}) : [];
  }, [selectedPacchetto]);

  const varianti = useMemo(() => {
    return (selectedPacchetto && selectedFinituraGroup)
      ? (RIGIDE_DATA[selectedPacchetto]?.[selectedFinituraGroup] || [])
      : [];
  }, [selectedPacchetto, selectedFinituraGroup]);

  const summaryData = useMemo(() => ({
    totalPages: getLS('totalPages', 'pagineTotali') || '—',
    quantity: getLS('quantita','quantità','orderQty','qty','copie','copies','numeroCopie','pvQty') || '1',
    isDuplex: getLS('copieFronteRetro') ? 'Sì' : 'No',
    frontispiece: getLS('frontespizioInterno') || '—',
    paper: getLS('cartaInterna') || '—',
    bwPages: getLS('bnPages', 'pagesBN') || '—',
    colorPages: getLS('colorPages', 'pagesColor') || '—',
  }), []);

  const pricing = useMemo(() => {
    const quantity = parseInt(getLS('quantita','quantità','orderQty','qty','copie','copies','numeroCopie','pvQty'), 10) || 1;

    // Page printing cost calculation
    const bwPages = parseInt(getLS('bnPages'), 10) || 0;
    const colorPages = parseInt(getLS('colorPages'), 10) || 0;
    const bnPrice = parseFloat(getLS('bnPrice')) || 0;
    const colorPrice = parseFloat(getLS('colorPrice')) || 0;
    const pagePrintingCostPerCopy = (bwPages * bnPrice) + (colorPages * colorPrice);
    const totalPageCost = pagePrintingCostPerCopy * quantity;

    // Cover cost calculation
    const baseCoverPrice = parsePrice(selectedPacchetto);
    const totalBaseCoverCost = baseCoverPrice * quantity;
    const discountPercentage = getDiscountPercentage(quantity);
    const discountAmountPerCopy = baseCoverPrice * discountPercentage;
    const discountedCoverPrice = baseCoverPrice - discountAmountPerCopy;
    const totalDiscountAmount = discountAmountPerCopy * quantity;

    // Final total
    const finalTotal = (pagePrintingCostPerCopy + discountedCoverPrice) * quantity;
    
    return {
        quantity,
        baseCoverPrice,
        totalBaseCoverCost,
        discountPercentage,
        discountAmountPerCopy,
        discountedCoverPrice,
        totalDiscountAmount,
        pagePrintingCostPerCopy,
        totalPageCost,
        finalTotal
    };
  }, [selectedPacchetto]);

  // --- HANDLERS for cascading changes ---
  const handlePacchettoChange = (newPacchetto: string) => {
      setSelectedPacchetto(newPacchetto);
      
      const availableFiniture = Object.keys(RIGIDE_DATA[newPacchetto] || {});
      const newFinituraGroup = availableFiniture[0] || '';
      setSelectedFinituraGroup(newFinituraGroup);

      const availableVarianti = RIGIDE_DATA[newPacchetto]?.[newFinituraGroup] || [];
      const newVariante = availableVarianti[0] || '';
      setSelectedVariante(newVariante);
  };

  const handleFinituraGroupChange = (newFinituraGroup: string) => {
      setSelectedFinituraGroup(newFinituraGroup);

      const availableVarianti = RIGIDE_DATA[selectedPacchetto]?.[newFinituraGroup] || [];
      const newVariante = availableVarianti[0] || '';
      setSelectedVariante(newVariante);
  };

  // --- EFFECTS ---
  
  // Generates a frontispiece preview with a transparent background.
  useEffect(() => {
    if (!frontispieceFile) {
      setFrontispiecePreviewUrl(null);
      return;
    }
    
    const generatePreview = async () => {
      if (!(window as any).pdfjsLib) {
        console.error("PDF.js is not loaded.");
        return;
      }
      setIsPreviewLoading(true);
      const fileUrl = URL.createObjectURL(frontispieceFile);
      try {
        const pdf = await (window as any).pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          const sampleIndex = (5 * canvas.width + 5) * 4;
          const bgR = data[sampleIndex];
          const bgG = data[sampleIndex + 1];
          const bgB = data[sampleIndex + 2];

          if (bgR > 200 || bgG > 200 || bgB > 200) {
              const tolerance = 20;
              for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  
                  if (
                      Math.abs(r - bgR) < tolerance &&
                      Math.abs(g - bgG) < tolerance &&
                      Math.abs(b - bgB) < tolerance
                  ) {
                      data[i + 3] = 0;
                  }
              }
              context.putImageData(imageData, 0, 0);
          }
          
          setFrontispiecePreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (error) {
        console.error('Error rendering frontispiece preview:', error);
        setFrontispiecePreviewUrl(null);
      } finally {
        URL.revokeObjectURL(fileUrl);
        setIsPreviewLoading(false);
      }
    };

    generatePreview();
  }, [frontispieceFile]);

  // Initialize state from localStorage or defaults, ensuring consistency
  useEffect(() => {
    const savedPacchetto = getLS('pacchetto');
    const savedFinitura = getLS('rivestimentoGruppo');
    const savedVariante = getLS('coloreCopertina');
    const savedLamina = getLS('laminazione');

    const initialPacchetto = savedPacchetto && RIGIDE_DATA[savedPacchetto] ? savedPacchetto : packageKeys[0];
    
    const availableFiniture = Object.keys(RIGIDE_DATA[initialPacchetto] || {});
    const initialFinitura = savedFinitura && availableFiniture.includes(savedFinitura) ? savedFinitura : (availableFiniture[0] || '');
    
    const availableVarianti = RIGIDE_DATA[initialPacchetto]?.[initialFinitura] || [];
    const initialVariante = savedVariante && availableVarianti.includes(savedVariante) ? savedVariante : (availableVarianti[0] || '');

    const initialLamina = savedLamina && LAMINA_COLORS.includes(savedLamina) ? savedLamina : LAMINA_COLORS[0];

    setSelectedPacchetto(initialPacchetto);
    setSelectedFinituraGroup(initialFinitura);
    setSelectedVariante(initialVariante);
    setSelectedLamina(initialLamina);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('rilegatura', 'Rigide');
    if (selectedPacchetto) localStorage.setItem('pacchetto', selectedPacchetto);
    if (selectedFinituraGroup) localStorage.setItem('rivestimentoGruppo', selectedFinituraGroup);
    if (selectedVariante) localStorage.setItem('coloreCopertina', selectedVariante);
    if (selectedLamina) localStorage.setItem('laminazione', selectedLamina);
    if (pricing.finalTotal > 0) {
        localStorage.setItem('totalCost', String(pricing.finalTotal));
    }
  }, [selectedPacchetto, selectedFinituraGroup, selectedVariante, selectedLamina, pricing.finalTotal]);

  const getTextureUrl = () => {
    if (!selectedFinituraGroup || !selectedVariante) {
      return '';
    }
    const group = selectedFinituraGroup.trim().toLowerCase().replace(/ /g, '-');
    const color = selectedVariante.trim().toLowerCase().replace(/ /g, '-');
    const fileName = `${group}-${color}.webp`;
    return `/textures/${fileName}`;
  };

  // --- RENDER ---

  return (
    <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Configura la tua Tesi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Scegli le opzioni per rilegatura, materiali e colori.</p>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tipologia di rilegatura</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
             <div className="has-checked flex items-center p-4 rounded-md border">
                <input type="radio" className="h-5 w-5 text-primary bg-transparent focus:ring-primary" checked readOnly/>
                <div className="ml-4">
                  <p className="font-medium text-gray-900 dark:text-white">Rigide</p>
                  <p className="text-sm text-muted-light dark:text-muted-dark">Robusta e professionale.</p>
                </div>
              </div>
          </div>
          
          <div className="h-px bg-subtle-light dark:bg-subtle-dark my-6"></div>

          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scegli pacchetto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packageKeys.map(pack => (
                <CardOption key={pack} name={normalizePackName(pack)} value={pack} groupName="pacchetto" priceBadge={priceFromLabel(pack)} checked={selectedPacchetto === pack} onChange={handlePacchettoChange} />
              ))}
            </div>
          </section>

          <div className="h-px bg-subtle-light dark:bg-subtle-dark my-6"></div>

          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scegli il tipo di rivestimento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {finituraGroups.map(group => (
                 <CardOption key={group} name={group} value={group} groupName="finitura-group" checked={selectedFinituraGroup === group} onChange={handleFinituraGroupChange} />
              ))}
            </div>
          </section>
          
          <div className="h-px bg-subtle-light dark:bg-subtle-dark my-6"></div>
          
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scegli il tipo di colore</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {varianti.map(v => ( <SwatchOption key={v} label={v} groupName="finitura-variante" checked={selectedVariante === v} onChange={setSelectedVariante} /> ))}
            </div>
          </section>

          <div className="h-px bg-subtle-light dark:bg-subtle-dark my-6"></div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Scegli il tipo di laminazione (frontespizio)</h3>
          <div className="grid grid-cols-5 gap-5">
            {LAMINA_COLORS.map(c => ( <SwatchOption key={c} label={c} groupName="lamina-color" checked={selectedLamina === c} onChange={setSelectedLamina} /> ))}
          </div>
        </div>
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-8">
          {/* ANTEPRIMA */}
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Anteprima</h3>
            <div 
              className="relative aspect-[3/4] bg-background-light dark:bg-background-dark rounded-md flex items-center justify-center p-4 border border-subtle-light dark:border-subtle-dark overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url("${getTextureUrl()}")` }}
            >
              {isPreviewLoading ? (
                 <div className="flex flex-col items-center gap-2 text-white/80" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold">Generazione...</span>
                </div>
              ) : frontispiecePreviewUrl ? (
                <img 
                  src={frontispiecePreviewUrl} 
                  alt="Anteprima frontespizio" 
                  className="absolute inset-0 w-full h-full object-contain p-4 transition-all duration-300" 
                  style={{ filter: laminaFilterMap[selectedLamina] }}
                />
              ) : (
                <div className="text-center text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  <p className="text-lg font-bold">Anteprima non disponibile</p>
                  <p className="text-xs">Carica il frontespizio nello Step 1</p>
                </div>
              )}
            </div>
          </div>

          {/* RIEPILOGO */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
             <button onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-600 text-white hover:bg-gray-700 transition-colors" aria-expanded={isSummaryExpanded}>
              <span className="text-base font-bold">Riepilogo della lavorazione</span>
               <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>{isSummaryExpanded ? 'remove' : 'add'}</span>
            </button>
            {isSummaryExpanded && (
              <div className="px-6 pb-6 pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine totali:</span><span className="font-medium">{summaryData.totalPages}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Quantità:</span><span className="font-medium">{summaryData.quantity}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Stampa fronte-retro:</span><span className="font-medium">{summaryData.isDuplex}</span></div>
                  {/* FIX: Corrected typo from `frontespiece` to `frontispiece` */}
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Frontespizio interno:</span><span className="font-medium">{summaryData.frontispiece}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Carta (pagine interne):</span><span className="font-medium">{summaryData.paper}</span></div>
                  <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine B/N:</span><span className="font-medium">{summaryData.bwPages}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine a Colori:</span><span className="font-medium">{summaryData.colorPages}</span></div>
                  <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rilegatura:</span><span className="font-medium">Rigide</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pacchetto:</span><span className="font-medium">{normalizePackName(selectedPacchetto)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rivestimento:</span><span className="font-medium">{selectedFinituraGroup || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore copertina:</span><span className="font-medium">{selectedVariante || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore laminazione:</span><span className="font-medium">{selectedLamina || '—'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* PREVENTIVO */}
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Preventivo</h3>
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                <span className="text-sm text-muted-light dark:text-muted-dark">Quantità</span>
                <span className="text-sm font-semibold">{pricing.quantity}</span>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm text-muted-light dark:text-muted-dark">Costo stampa (pagine interne)</span>
                <span className="text-sm font-semibold">{fmtEuro(pricing.totalPageCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-light dark:text-muted-dark">Costo copertine ({pricing.quantity}x)</span>
                <span className="text-sm font-semibold">{fmtEuro(pricing.totalBaseCoverCost)}</span>
              </div>

              {pricing.discountPercentage > 0 && (
                <div className="flex items-center justify-between text-green-700 dark:text-green-400">
                  <span className="text-sm">Sconto copertina ({pricing.discountPercentage * 100}%)</span>
                  <span className="text-sm font-semibold">- {fmtEuro(pricing.totalDiscountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-light dark:text-muted-dark">Spedizione</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-800/30 dark:text-green-200">
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    Gratis
                </span>
              </div>
            </div>
            <div className="h-px bg-subtle-light dark:bg-subtle-dark my-4"></div>
            <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Totale preventivo</span>
                <span className="font-bold text-primary">{fmtEuro(pricing.finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Binding;