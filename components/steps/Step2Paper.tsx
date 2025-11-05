import React, { useState, useEffect, useMemo } from 'react';
import ToggleSwitch from '../ToggleSwitch';

const paperOptions = [
  {
    id: '80g',
    name: '80g – Standard',
    description: 'Per tesi con testi brevi. Superficie liscia, stampa chiara.',
    bwPrice: 0.10,
    colorPrice: 0.35,
  },
  {
    id: '100g',
    name: '100g – Premium',
    description: 'Per testi + immagini. Tocco più elegante.',
    bwPrice: 0.20,
    colorPrice: 0.50,
  },
  {
    id: '120g',
    name: '120g – Top',
    description: 'Per resa elevata e consistenza robusta.',
    bwPrice: 0.20,
    colorPrice: 0.55,
  }
];

interface Step2PaperProps {
  thesisPreviewUrl: string | null;
  totalPages: number;
}

const Step2Paper: React.FC<Step2PaperProps> = ({ thesisPreviewUrl, totalPages }) => {
  const [isFrontAndBack, setIsFrontAndBack] = useState<boolean>(false);
  const [hasInternalFrontispiece, setHasInternalFrontispiece] = useState<boolean>(false);
  const [selectedPaper, setSelectedPaper] = useState<string>('80g – Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(false);

  // Caricamento iniziale da localStorage
  useEffect(() => {
    const LS_fr = localStorage.getItem('copieFronteRetro');
    setIsFrontAndBack(!!LS_fr && LS_fr !== '—' && LS_fr !== '0');

    const LS_fi = localStorage.getItem('frontespizioInterno');
    setHasInternalFrontispiece((LS_fi || '').toLowerCase() === 'sì');

    const LS_paper = localStorage.getItem('cartaInterna');
    if (LS_paper && paperOptions.some(p => p.name === LS_paper)) {
      setSelectedPaper(LS_paper);
    }
    
    const LS_qtyKeys = ['quantita','quantità','orderQty','qty','copie','copies','numeroCopie','pvQty'];
    let qtyFound = false;
    for (const k of LS_qtyKeys) {
        const v = localStorage.getItem(k);
        if (v) {
            const parsedV = parseInt(v, 10);
            if (!isNaN(parsedV) && parsedV > 0) {
                setQuantity(parsedV);
                qtyFound = true;
                break;
            }
        }
    }
    if (!qtyFound) setQuantity(1);

  }, []);

  // Logica di calcolo centralizzata
  const { effectiveTotalPages, frontAndBackSheets, thesisSheets } = useMemo(() => {
    const pages = totalPages + (hasInternalFrontispiece ? 1 : 0);
    
    // Logica aggiornata: il frontespizio occupa sempre 1 foglio a parte.
    const calculatedThesisSheets = (isFrontAndBack && totalPages > 0) ? Math.ceil(totalPages / 2) : 0;
    const frontispieceSheet = (isFrontAndBack && hasInternalFrontispiece) ? 1 : 0;
    const sheets = calculatedThesisSheets + frontispieceSheet;

    return { 
      effectiveTotalPages: pages, 
      frontAndBackSheets: sheets, 
      thesisSheets: calculatedThesisSheets 
    };
  }, [totalPages, hasInternalFrontispiece, isFrontAndBack]);


  // Persistenza su localStorage ad ogni cambiamento
  useEffect(() => {
    localStorage.setItem('totalPages', String(totalPages));
    localStorage.setItem('copieFronteRetro', frontAndBackSheets > 0 ? String(frontAndBackSheets) : '');
    localStorage.setItem('frontespizioInterno', hasInternalFrontispiece ? 'Sì' : 'No');
    localStorage.setItem('cartaInterna', selectedPaper);
    
    const paperData = paperOptions.find(p => p.name === selectedPaper);
    if (paperData) {
        localStorage.setItem('bnPrice', String(paperData.bwPrice));
        localStorage.setItem('colorPrice', String(paperData.colorPrice));
    }

    const qtyKeys = ['quantita','quantità','orderQty','qty','copie','copies','numeroCopie','pvQty'];
    qtyKeys.forEach(k => localStorage.setItem(k, String(quantity)));

  }, [hasInternalFrontispiece, selectedPaper, quantity, totalPages, frontAndBackSheets]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(val > 0 ? val : 1);
  };

  return (
    <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Colonna sinistra (2/3) */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Configurazione pagine</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Imposta numero pagine, fronte-retro, frontespizio interno e la carta delle pagine interne.
          </p>

          {/* Opzioni di stampa */}
          <div className="border-t border-subtle-light dark:border-subtle-dark pt-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Opzioni di stampa</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-md bg-background-light dark:bg-background-dark">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Stampa fronte-retro</p>
                  <p className="text-sm text-muted-light dark:text-muted-dark">Stampa su entrambi i lati del foglio</p>
                </div>
                <ToggleSwitch id="chk-fr" checked={isFrontAndBack} onChange={setIsFrontAndBack} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-md bg-background-light dark:bg-background-dark">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Frontespizio interno</p>
                  <p className="text-sm text-muted-light dark:text-muted-dark">Aggiunge una copia del frontespizio all'interno della tesi</p>
                </div>
                <ToggleSwitch id="chk-fi" checked={hasInternalFrontispiece} onChange={setHasInternalFrontispiece} />
              </div>
            </div>
          </div>

          {/* Carta (pagine interne) */}
          <div className="border-t border-subtle-light dark:border-subtle-dark pt-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Carta (pagine interne)</h3>
            <div className="space-y-3">
              {paperOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-md border cursor-pointer transition-all ${selectedPaper === option.name ? 'has-checked border-primary bg-primary/5' : 'border-subtle-light dark:border-subtle-dark'}`}
                >
                  <input
                    type="radio"
                    name="paper-option"
                    className="form-radio h-5 w-5 border-subtle-light dark:border-subtle-dark text-primary bg-transparent focus:ring-primary focus:ring-offset-0"
                    checked={selectedPaper === option.name}
                    onChange={() => setSelectedPaper(option.name)}
                  />
                  <div className="ml-4 w-full">
                    <p className="font-medium text-gray-900 dark:text-white">{option.name}</p>
                    <p className="text-sm text-muted-light dark:text-muted-dark">{option.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="flex justify-between bg-background-light/70 dark:bg-background-dark/70 p-3 rounded-md">
                        <div className="text-sm font-medium">Bianco e nero</div>
                        <div className="text-sm font-bold text-primary">€{option.bwPrice.toFixed(2)}</div>
                      </div>
                      <div className="flex justify-between bg-background-light/70 dark:bg-background-dark/70 p-3 rounded-md">
                        <div className="text-sm font-medium">Colore</div>
                        <div className="text-sm font-bold text-primary">€{option.colorPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quantità */}
          <div className="border-t border-subtle-light dark:border-subtle-dark pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Numero di Copie</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
              Indica il numero totale di tesi identiche che desideri ordinare.
            </p>
            <div className="flex items-center justify-between p-4 rounded-md bg-background-light dark:bg-background-dark">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Quantità</p>
                <p className="text-sm text-muted-light dark:text-muted-dark">Numero di copie da stampare</p>
              </div>
              <input
                id="inp-qty"
                type="number"
                min="1"
                step="1"
                className="w-24 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/40"
                value={quantity}
                onChange={handleQuantityChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Colonna destra (1/3) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-8">
          {/* ANTEPRIMA */}
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Anteprima</h3>
            <div className="aspect-[3/4] bg-background-light dark:bg-background-dark rounded-md flex items-center justify-center p-4 border border-subtle-light dark:border-subtle-dark overflow-hidden">
              {thesisPreviewUrl ? (
                <img src={thesisPreviewUrl} alt="Anteprima Tesi" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">La tua fantastica tesi</p>
                  <p className="text-sm text-muted-light dark:text-muted-dark">di John Doe</p>
                  <div className="my-8 h-px w-24 bg-subtle-light dark:bg-subtle-dark mx-auto"></div>
                  <p className="text-xs text-muted-light dark:text-muted-dark">Anteprima simulata</p>
                </div>
              )}
            </div>
          </div>

          {/* RIEPILOGO DELLA LAVORAZIONE */}
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="acc-header w-full flex items-center justify-between px-5 py-4 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              aria-expanded={isSummaryExpanded}
            >
              <span className="text-base font-bold">Riepilogo della lavorazione</span>
              <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                {isSummaryExpanded ? 'remove' : 'add'}
              </span>
            </button>
            {isSummaryExpanded && (
              <div className="px-6 pb-6 pt-4">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-light dark:text-muted-dark pt-0.5">Pagine totali:</span>
                    <div className="text-right">
                      <span className="font-medium text-base">{totalPages > 0 ? effectiveTotalPages : '—'}</span>
                      {hasInternalFrontispiece && totalPages > 0 && (
                        <p className="text-xs text-muted-light dark:text-muted-dark">
                          ({totalPages} + 1 frontespizio)
                        </p>
                      )}
                    </div>
                  </div>

                  {isFrontAndBack && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-light dark:text-muted-dark pt-0.5">Stampa fronte-retro:</span>
                      <div className="text-right">
                        <span className="font-medium text-base">{frontAndBackSheets > 0 ? `${frontAndBackSheets} fogli` : '—'}</span>
                        {isFrontAndBack && totalPages > 0 && (
                          <p className="text-xs text-muted-light dark:text-muted-dark">
                            {hasInternalFrontispiece 
                              ? `(${thesisSheets} tesi + 1 frontespizio)`
                              : `(da ${totalPages} pagine)`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-light dark:text-muted-dark">Frontespizio interno:</span>
                    <span className="font-medium">{hasInternalFrontispiece ? 'Sì' : 'No'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-light dark:text-muted-dark">Carta (pagine interne):</span>
                    <span className="font-medium text-right">{selectedPaper}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PREVENTIVO */}
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Preventivo</h3>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-light dark:text-muted-dark">Quantità</span>
              <span className="text-base font-semibold">{quantity}</span>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-light dark:text-muted-dark">Spedizione</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-800/30 dark:text-green-200">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                Spedizione gratis
              </span>
            </div>
            <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Totale preventivo</span>
              <span className="font-semibold">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Paper;