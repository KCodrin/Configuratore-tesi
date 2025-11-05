import React, { useState, useEffect } from 'react';

const getLS = (...keys: string[]) => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return null;
};

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

const provinces = [
  'Roma (RM)', 'Milano (MI)', 'Napoli (NA)', 'Torino (TO)',
  'Palermo (PA)', 'Genova (GE)', 'Bologna (BO)', 'Firenze (FI)',
  'Bari (BA)', 'Catania (CT)'
  // Aggiungere altre province se necessario
];

const SummaryRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-muted-light dark:text-muted-dark">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
};

interface Step7CheckoutProps {
  onValidationChange: (isValid: boolean) => void;
}

const Step7Checkout: React.FC<Step7CheckoutProps> = ({ onValidationChange }) => {
  const [formData, setFormData] = useState({
    billName: '', billSurname: '', billMail: '', billPhone: '',
    shipAddress: '', shipCap: '', shipCity: '', shipProvince: '',
    ship2Address: '', ship2Cap: '', ship2City: '', ship2Province: '',
    orderNotes: '',
    cardNumber: '', cardExpiry: '', cardCvv: '',
    chkNews: false,
  });

  const [showAltAddress, setShowAltAddress] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [summary, setSummary] = useState<Record<string, any>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value
    }));
  };

  useEffect(() => {
    onValidationChange(privacyAccepted);
  }, [privacyAccepted, onValidationChange]);


  useEffect(() => {
    const rileg = getLS('rilegatura');
    const isRigide = rileg?.toLowerCase().includes('rigid');
    
    let finalTotal = getLS('orderTotal', 'totaleOrdine', 'finalTotal');
    if (finalTotal && !finalTotal.startsWith('€')) {
        finalTotal = '€' + parseFloat(finalTotal).toFixed(2).replace('.', ',');
    }

    const CUSTOM_APPS = [
        { id: 'girasole', name: 'Girasole' }, { id: 'ciliegio', name: 'Fiore di ciliegio rosa' },
        { id: 'ragno', name: 'Fiore ragno blu' }, { id: 'ibisco', name: 'Fiore di ibisco rosso' }
    ];
    const selectedApp = CUSTOM_APPS.find(app => getLS(`opt${app.name.split(' ')[0]}`) === '1')?.name || null;

    let bwPagesStr = 'Nessuna';
    let colorPagesStr = 'Nessuna';
    try {
        const pageColors: ('bw' | 'color')[] = JSON.parse(getLS('pageColors') || '[]');
        const bwIndices = pageColors.map((c, i) => c === 'bw' ? i : -1).filter(i => i !== -1);
        const colorIndices = pageColors.map((c, i) => c === 'color' ? i : -1).filter(i => i !== -1);
        bwPagesStr = compressPageNumbers(bwIndices);
        colorPagesStr = compressPageNumbers(colorIndices);
    } catch(e) {
        console.error("Error parsing page colors from LS", e);
    }

    setSummary({
      // Step 2
      totalPages: getLS('totalPages','pagineTotali'),
      quantity: getLS('quantita', 'quantità') || '1',
      fronteRetro: getLS('copieFronteRetro','fronteRetro','copieFD') ? 'Sì' : 'No',
      frontespizio: getLS('frontespizioInterno','frontespizio'),
      carta: getLS('cartaInterna','paperType','cartaPagine'),
      // Step 3
      bwPages: getLS('bnPages'),
      colorPages: getLS('colorPages'),
      bwPagesStr,
      colorPagesStr,
      // Step 4
      rilegatura: rileg,
      pacchetto: getLS('pacchetto')?.replace(/\s*–\s*da\s*€[\d.,]+/, ''),
      rivestimento: getLS('rivestimentoGruppo'),
      coverColor: getLS('coloreCopertina'),
      lamina: getLS('laminazione'),
      isRigide,
      // Step 5
      hasAngoli: getLS('optAngoli') === '1' ? 'Sì' : 'No',
      selectedApp: selectedApp,
      // Total
      totale: finalTotal || '€0,00',
    });

    try {
        const savedData = localStorage.getItem('checkoutForm');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData(prev => ({...prev, ...parsedData}));
            setShowAltAddress(!!(parsedData.ship2Address || parsedData.ship2Cap || parsedData.ship2City));
        }
    } catch (e) { console.error("Could not load checkout form data.", e); }
  }, []);

  useEffect(() => {
      localStorage.setItem('checkoutForm', JSON.stringify(formData));
  }, [formData]);


  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonna sinistra (2/3): Dettagli di fatturazione */}
        <div className="lg:col-span-2 lg:col-start-1">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Dettagli di fatturazione</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Inserisci i dati di fatturazione e spedizione per completare l’ordine.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dati di fatturazione</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Nome</span>
                <input name="billName" value={formData.billName} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Mario" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Cognome</span>
                <input name="billSurname" value={formData.billSurname} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Rossi" />
              </label>
            </div>
            <div className="space-y-4 mb-8">
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Mail</span>
                <input name="billMail" type="email" value={formData.billMail} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="nome@dominio.it" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Cellulare</span>
                <input name="billPhone" type="tel" value={formData.billPhone} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="+39 ..." />
              </label>
            </div>
            <div className="h-px bg-subtle-light dark:bg-subtle-dark my-6"></div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dati di spedizione</h3>
            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Via e numero civico</span>
                <input name="shipAddress" value={formData.shipAddress} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Via Roma 10" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">CAP</span>
                  <input name="shipCap" value={formData.shipCap} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="00100" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Città</span>
                  <input name="shipCity" value={formData.shipCity} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Roma" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Provincia</span>
                <select name="shipProvince" value={formData.shipProvince} onChange={handleChange} className="form-select w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50">
                  <option value="">Seleziona provincia</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 mb-4">
              <input type="checkbox" checked={showAltAddress} onChange={e => setShowAltAddress(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary/50" />
              <span className="text-sm text-gray-800 dark:text-gray-200">Spedire a un indirizzo diverso?</span>
            </label>

            {showAltAddress && (
              <div className="space-y-4 mb-6">
                <label className="block">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Via e numero civico</span>
                  <input name="ship2Address" value={formData.ship2Address} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Via Verdi 20" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">CAP</span>
                    <input name="ship2Cap" value={formData.ship2Cap} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="20100" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Città</span>
                    <input name="ship2City" value={formData.ship2City} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="Milano" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Provincia</span>
                  <select name="ship2Province" value={formData.ship2Province} onChange={handleChange} className="form-select w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50">
                    <option value="">Seleziona provincia</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Note</span>
              <textarea name="orderNotes" value={formData.orderNotes} onChange={handleChange} className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 min-h-24" placeholder="Indicazioni utili per la consegna o la lavorazione..."></textarea>
            </label>
          </div>
        </div>

        {/* Colonna destra (1/3) */}
        <div className="lg:col-span-1 lg:col-start-3">
          <div className="sticky top-24">
            <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-auto pr-1">
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Riepilogo Ordine</h3>
                <div className="space-y-3 text-sm">
                    {/* STEP 2 */}
                    <SummaryRow label="Pagine totali" value={summary.totalPages} />
                    <SummaryRow label="Quantità" value={summary.quantity} />
                    <SummaryRow label="Stampa fronte-retro" value={summary.fronteRetro} />
                    <SummaryRow label="Frontespizio interno" value={summary.frontespizio} />
                    <SummaryRow label="Carta (pagine interne)" value={summary.carta} />
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>

                    {/* STEP 3 */}
                    {summary.bwPagesStr && (
                        <div className="flex justify-between items-start">
                            <span className="text-muted-light dark:text-muted-dark pt-0.5">Pagine B/N ({summary.bwPages}):</span>
                            <span className="font-medium text-right break-all pl-2">{summary.bwPagesStr}</span>
                        </div>
                    )}
                    {summary.colorPagesStr && (
                        <div className="flex justify-between items-start">
                            <span className="text-muted-light dark:text-muted-dark pt-0.5">Pagine a Colori ({summary.colorPages}):</span>
                            <span className="font-medium text-right break-all pl-2">{summary.colorPagesStr}</span>
                        </div>
                    )}
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>

                    {/* STEP 4 */}
                    <SummaryRow label="Rilegatura" value={summary.rilegatura} />
                    <SummaryRow label="Pacchetto" value={summary.pacchetto} />
                    <SummaryRow label="Rivestimento" value={summary.rivestimento} />
                    <SummaryRow label="Colore Copertina" value={summary.coverColor} />
                    <SummaryRow label="Colore Laminazione" value={summary.lamina} />
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>
                    
                    {/* STEP 5 */}
                    <SummaryRow label="Capitelli" value={summary.isRigide ? 'Inclusi' : undefined} />
                    <SummaryRow label="Angoli metallici" value={summary.hasAngoli} />
                    <SummaryRow label="Applicazione" value={summary.selectedApp} />
                    
                    <div className="h-px bg-subtle-light dark:bg-subtle-dark my-3"></div>

                    {/* TOTALE */}
                    <div className="flex items-baseline justify-between">
                        <span className="text-base font-bold text-gray-900 dark:text-white">Totale</span>
                        <span className="text-base font-extrabold">{summary.totale}</span>
                    </div>
                </div>
              </div>

              <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pagamento</h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Numero carta</span>
                    <input name="cardNumber" value={formData.cardNumber} onChange={handleChange} inputMode="numeric" autoComplete="cc-number" className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="1234 5678 9012 3456" />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">Scadenza (MM/AA)</span>
                      <input name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} inputMode="numeric" autoComplete="cc-exp" className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="MM/AA" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block">CVV</span>
                      <input name="cardCvv" value={formData.cardCvv} onChange={handleChange} inputMode="numeric" autoComplete="cc-csc" className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50" placeholder="123" />
                    </label>
                  </div>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary/50" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Accetto l’ <a href="#" className="font-medium text-primary hover:underline">Informativa sulla Privacy</a> &amp; <a href="#" className="font-medium text-primary hover:underline">Termini di Servizio</a></span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input name="chkNews" type="checkbox" checked={formData.chkNews} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary/50" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Iscriviti alla nostra newsletter (facoltativo)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step7Checkout;