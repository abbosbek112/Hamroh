
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdSeq = 0;
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() * 1000 + (toastIdSeq++ % 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up backdrop-blur-md ${
              t.type === 'error'
                ? 'bg-red-500/90 text-white border-red-400'
                : t.type === 'success'
                ? 'bg-green-500/90 text-white border-green-400'
                : 'bg-slate-800/90 text-white border-slate-700'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle size={20} />
            ) : t.type === 'error' ? (
              <AlertTriangle size={20} />
            ) : (
              <Info size={20} />
            )}
            <span className="font-bold text-sm">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-auto p-1 hover:bg-white/20 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
