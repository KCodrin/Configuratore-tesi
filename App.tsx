import React, { useState } from 'react';
import Step1Upload from './components/steps/Step1Upload';
import Step2Paper from './components/steps/Step2Paper';
import Step3PageColors from './components/steps/Step3PageColors';
import Step4Binding from './components/steps/Step4Binding';
import Step5ExtraOptions from './components/steps/Step5ExtraOptions';
import Step6Review from './components/steps/Step6Review';
import Step7Checkout from './components/steps/Step7Checkout';


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [thesisFile, setThesisFile] = useState<File | null>(null);
  const [frontispieceFile, setFrontispieceFile] = useState<File | null>(null);
  const [thesisPreviewUrl, setThesisPreviewUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isStepValid, setIsStepValid] = useState(true);
  const totalSteps = 7;

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // For step 7, the button should start as disabled until the privacy checkbox is ticked.
      if (nextStep === 7) {
        setIsStepValid(false);
      } else {
        setIsStepValid(true); // Reset validation for other steps
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(true); // Also reset on going back
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Upload 
                  thesisFile={thesisFile} 
                  frontispieceFile={frontispieceFile} 
                  setThesisFile={setThesisFile} 
                  setFrontispieceFile={setFrontispieceFile} 
                  thesisPreviewUrl={thesisPreviewUrl}
                  setThesisPreviewUrl={setThesisPreviewUrl}
                  setTotalPages={setTotalPages}
                />;
      case 2:
        return <Step2Paper thesisPreviewUrl={thesisPreviewUrl} totalPages={totalPages} />;
      case 3:
        return <Step3PageColors onValidationChange={setIsStepValid} thesisFile={thesisFile} frontispieceFile={frontispieceFile} thesisPreviewUrl={thesisPreviewUrl} />;
      case 4:
        return <Step4Binding frontispieceFile={frontispieceFile} />;
      case 5:
        return <Step5ExtraOptions />;
      case 6:
        return <Step6Review thesisFile={thesisFile} frontispieceFile={frontispieceFile} />;
      case 7:
        return <Step7Checkout onValidationChange={setIsStepValid} />;
      default:
        return <Step1Upload 
                  thesisFile={thesisFile} 
                  frontispieceFile={frontispieceFile} 
                  setThesisFile={setThesisFile} 
                  setFrontispieceFile={setFrontispieceFile} 
                  thesisPreviewUrl={thesisPreviewUrl}
                  setThesisPreviewUrl={setThesisPreviewUrl}
                  setTotalPages={setTotalPages}
                />;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) {
      return !thesisFile || !frontispieceFile;
    }
    if (!isStepValid) {
      return true;
    }
    return false;
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-foreground-light dark:text-foreground-dark">
      <div className="flex flex-col min-h-screen pb-24">
        <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
               <div className="absolute left-1/2 -translate-x-1/2 text-center">
                <span className="font-bold text-slate-600 dark:text-slate-400">Step {currentStep} / {totalSteps}</span>
              </div>
              <div/>
              <button 
                onClick={() => setShowExitModal(true)}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" 
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {renderStep()}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark p-4 shadow-lg border-t border-slate-200 dark:border-slate-800 flex justify-center items-center gap-4">
          {currentStep > 1 && (
            <button 
              onClick={handlePrevStep}
              className="flex items-center justify-center h-12 px-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-base font-bold transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              <span>Passo precedente</span>
            </button>
          )}
          {currentStep < totalSteps && (
            <button 
              onClick={handleNextStep}
              className="flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-white text-base font-bold transition-colors shadow-lg shadow-primary/30 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed hover:bg-primary/90"
              disabled={isNextDisabled()}
            >
              <span>Passo successivo</span>
            </button>
          )}
          {currentStep === totalSteps && (
            <button 
              // onClick={handlePayment} // Placeholder for payment logic
              className="flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-white text-base font-bold transition-colors shadow-lg shadow-primary/30 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed hover:bg-primary/90"
              disabled={!isStepValid}
            >
              <span>Procedi al pagamento</span>
            </button>
          )}
        </footer>
      </div>

      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground-light dark:text-foreground-dark mb-4">Sei sicuro di voler uscire?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Tutti i progressi non salvati andranno persi.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowExitModal(false)} 
                className="flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-white text-base font-bold transition-colors shadow-lg shadow-primary/30 hover:bg-primary/90 w-full"
              >
                Continua configurazione
              </button>
              <button 
                onClick={() => setShowExitModal(false)}
                className="flex items-center justify-center h-10 px-6 rounded-lg bg-transparent text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors w-full border border-slate-300 dark:border-slate-700"
              >
                Abbandona configurazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;