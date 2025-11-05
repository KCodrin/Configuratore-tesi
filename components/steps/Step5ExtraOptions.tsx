import React, { useState, useEffect, useMemo } from 'react';
import ToggleSwitch from '../ToggleSwitch';

// --- HELPER FUNCTIONS ---
const getLS = (...keys: string[]): string => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return '';
};

const fmtEuro = (n: number | null | undefined): string => (n == null || isNaN(n)) ? '—' : ('€' + n.toFixed(2).replace('.', ','));

const normalizePackName = (p: string) => (p || '').replace(/\s*–\s*da\s*€[\d,.]+/,'');


// --- CONSTANTS ---
const PRICE_ANGOLI = 1.00;
const CUSTOM_APPS = [
    { id: 'girasole', name: 'Girasole', price: 10.00, imageUrl: 'https://picsum.photos/seed/girasole/200' },
    { id: 'ciliegio', name: 'Fiore di ciliegio rosa', price: 10.00, imageUrl: 'https://picsum.photos/seed/ciliegio/200' },
    { id: 'ragno', name: 'Fiore ragno blu', price: 10.00, imageUrl: 'https://picsum.photos/seed/ragno/200' },
    { id: 'ibisco', name: 'Fiore di ibisco rosso', price: 10.00, imageUrl: 'https://picsum.photos/seed/ibisco/200' }
];


const Step5ExtraOptions: React.FC = () => {
    // --- STATE ---
    const [hasAngoli, setHasAngoli] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

    const handleApplicationChange = (appId: string) => {
        setSelectedApplication(prev => (prev === appId ? null : appId));
    };

    const { summaryData, pricing } = useMemo(() => {
        const summary = {
            totalPages: getLS('totalPages', 'pagineTotali'),
            quantity: getLS('quantita','quantità','orderQty','qty','copie','copies','numeroCopie','pvQty') || '1',
            isDuplex: getLS('copieFronteRetro') ? 'Sì' : 'No',
            frontispiece: getLS('frontespizioInterno'),
            paper: getLS('cartaInterna'),
            bwPages: getLS('bnPages', 'pagesBN'),
            colorPages: getLS('colorPages', 'pagesColor'),
            pacchetto: normalizePackName(getLS('pacchetto')),
            rivestimento: getLS('rivestimentoGruppo'),
            coloreCopertina: getLS('coloreCopertina'),
            laminazione: getLS('laminazione'),
        };
        
        const baseTotal = parseFloat(getLS('totalCost')) || 0;
        const angoliCost = hasAngoli ? PRICE_ANGOLI : 0;
        
        const selectedApp = CUSTOM_APPS.find(app => app.id === selectedApplication);
        const customAppsTotalCost = selectedApp ? selectedApp.price : 0;
        
        const extraOptionsTotal = angoliCost + customAppsTotalCost;
        const finalTotal = baseTotal + extraOptionsTotal;

        const priceDetails = { 
            baseTotal, 
            angoliCost, 
            girasoleCost: selectedApplication === 'girasole' ? customAppsTotalCost : 0,
            ciliegioCost: selectedApplication === 'ciliegio' ? customAppsTotalCost : 0,
            ragnoCost: selectedApplication === 'ragno' ? customAppsTotalCost : 0,
            ibiscoCost: selectedApplication === 'ibisco' ? customAppsTotalCost : 0,
            extraOptionsTotal, 
            finalTotal 
        };

        return { summaryData: summary, pricing: priceDetails };
    }, [hasAngoli, selectedApplication]);
    
    // --- EFFECTS ---
    useEffect(() => {
        setHasAngoli(getLS('optAngoli') === '1');
        
        let foundApp: string | null = null;
        if (getLS('optGirasole') === '1') foundApp = 'girasole';
        else if (getLS('optCiliegio') === '1') foundApp = 'ciliegio';
        else if (getLS('optRagno') === '1') foundApp = 'ragno';
        else if (getLS('optIbisco') === '1') foundApp = 'ibisco';
        setSelectedApplication(foundApp);

    }, []);

    useEffect(() => {
        localStorage.setItem('optAngoli', hasAngoli ? '1' : '0');
        
        CUSTOM_APPS.forEach(app => {
            const isSelected = selectedApplication === app.id;
            localStorage.setItem(`opt${app.name.split(' ')[0]}`, isSelected ? '1' : '0');
            localStorage.setItem(`opt${app.name.split(' ')[0]}Price`, isSelected ? app.price.toFixed(2) : '0');
        });

        localStorage.setItem('finalTotal', pricing.finalTotal.toFixed(2));
    }, [hasAngoli, selectedApplication, pricing.finalTotal]);


    return (
        <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2">
                <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Opzioni Extra</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Aggiungi accessori e personalizzazioni alla tua tesi.</p>
                    
                    <div className="space-y-4">
                        {/* Capitelli */}
                        <div className="flex items-center gap-5 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-card-dark/50">
                            <div className="w-16 h-16 rounded-lg bg-subtle-light dark:bg-subtle-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-muted-light dark:text-muted-dark">layers</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">Capitelli</p>
                                <p className="text-base text-gray-600 dark:text-gray-400">Sempre inclusi nel prezzo</p>
                            </div>
                            <span className="ml-auto text-sm font-semibold text-primary">Incluso</span>
                        </div>

                        {/* Angoli metallici */}
                        <div className="flex items-center gap-5 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-card-dark/50">
                            <div className="w-16 h-16 rounded-lg bg-subtle-light dark:bg-subtle-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-muted-light dark:text-muted-dark">aspect_ratio</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">Angoli metallici</p>
                                <p className="text-base text-gray-600 dark:text-gray-400">Protezione degli angoli.</p>
                            </div>
                            <div className="ml-auto flex items-center gap-3">
                                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{fmtEuro(PRICE_ANGOLI)}</span>
                                <ToggleSwitch id="opt-angoli" checked={hasAngoli} onChange={setHasAngoli} aria-label="Attiva angoli metallici" />
                            </div>
                        </div>
                    </div>


                    {/* Applicazione personalizzata Section */}
                    <div className="border-t border-subtle-light dark:border-subtle-dark pt-6 mt-8">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Applicazione personalizzata</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 -mt-2 mb-4">Scegli un'applicazione da aggiungere sulla tua copertina.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CUSTOM_APPS.map(app => {
                                const isSelected = selectedApplication === app.id;
                                return (
                                    <div
                                        key={app.id}
                                        onClick={() => handleApplicationChange(app.id)}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleApplicationChange(app.id); }}
                                        className={`relative block p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-card-dark ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-background-light dark:bg-card-dark/50 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow">
                                                <span className="material-symbols-outlined text-base">check</span>
                                            </div>
                                        )}
                                        <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-gray-700">
                                            <img src={app.imageUrl} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white mb-1 h-8 flex items-center justify-center">{app.name}</p>
                                            <span className="font-semibold text-primary text-sm">{fmtEuro(app.price)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                    {/* Riepilogo */}
                    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <button onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-600 text-white hover:bg-gray-700 transition-colors" aria-expanded={isSummaryExpanded}>
                            <span className="text-base font-bold">Riepilogo della lavorazione</span>
                            <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>{isSummaryExpanded ? 'remove' : 'add'}</span>
                        </button>
                        {isSummaryExpanded && (
                            <div className="px-6 pb-6 pt-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine totali:</span><span className="font-medium">{summaryData.totalPages || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Quantità:</span><span className="font-medium">{summaryData.quantity}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Stampa fronte-retro:</span><span className="font-medium">{summaryData.isDuplex}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Frontespizio interno:</span><span className="font-medium">{summaryData.frontispiece || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Carta (pagine interne):</span><span className="font-medium">{summaryData.paper || '—'}</span></div>
                                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine B/N:</span><span className="font-medium">{summaryData.bwPages || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pagine a Colori:</span><span className="font-medium">{summaryData.colorPages || '—'}</span></div>
                                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rilegatura:</span><span className="font-medium">Rigide</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Pacchetto:</span><span className="font-medium">{summaryData.pacchetto || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Rivestimento:</span><span className="font-medium">{summaryData.rivestimento || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore copertina:</span><span className="font-medium">{summaryData.coloreCopertina || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Colore laminazione:</span><span className="font-medium">{summaryData.laminazione || '—'}</span></div>
                                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                                    <div className="flex justify-between"><span className="text-muted-light dark:text-muted-dark">Angoli metallici:</span><span className="font-medium">{hasAngoli ? 'Sì' : 'No'}</span></div>
                                    {selectedApplication && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-light dark:text-muted-dark">Applicazione:</span>
                                            <span className="font-medium">{CUSTOM_APPS.find(a => a.id === selectedApplication)?.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Preventivo */}
                     <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                        <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Preventivo</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-light dark:text-muted-dark">Costo base (stampa + copertina)</span>
                                <span className="font-semibold">{fmtEuro(pricing.baseTotal)}</span>
                            </div>
                            {pricing.extraOptionsTotal > 0 && (
                                <>
                                    {pricing.angoliCost > 0 && <div className="flex items-center justify-between text-sm"><span className="text-muted-light dark:text-muted-dark">Angoli metallici</span><span className="font-semibold">{fmtEuro(pricing.angoliCost)}</span></div>}
                                    {selectedApplication && <div className="flex items-center justify-between text-sm"><span className="text-muted-light dark:text-muted-dark">{CUSTOM_APPS.find(a => a.id === selectedApplication)?.name}</span><span className="font-semibold">{fmtEuro(pricing.extraOptionsTotal - pricing.angoliCost)}</span></div>}
                                </>
                            )}
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-light dark:text-muted-dark">Spedizione</span>
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 dark:bg-green-800/30 dark:text-green-200">
                                    <span className="material-symbols-outlined text-base">local_shipping</span> Gratis
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

export default Step5ExtraOptions;