import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="toast-portal-container"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const { id, message, type } = toast;

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      iconColor: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      Icon: CheckCircle2,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-800',
      iconColor: 'text-rose-500',
      barColor: 'bg-rose-500',
      Icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      iconColor: 'text-amber-500',
      barColor: 'bg-amber-500',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-500',
      barColor: 'bg-blue-500',
      Icon: Info,
    },
  }[type];

  const IconComponent = config.Icon;

  return (
    <motion.div
      id={`toast-card-${id}`}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-stretch gap-3 p-4 rounded-xl border ${config.bg} shadow-lg relative overflow-hidden`}
    >
      {/* Progress Bar Loader */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${config.barColor}`}
      />

      <div className={`flex-shrink-0 ${config.iconColor} self-start mt-0.5`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 pr-4">
        <p className={`text-xs font-bold ${config.text} leading-relaxed`}>
          {message}
        </p>
      </div>

      <button
        id={`toast-dismiss-${id}`}
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 self-start text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
