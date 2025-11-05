import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: 'check_circle',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

const colors = {
  success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 w-full max-w-md p-4 rounded-lg shadow-lg border animate-fade-in-up ${colors[type]}`}
      role="alert"
    >
      <span className="material-symbols-outlined text-xl">{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} aria-label="Chiudi notifica" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;