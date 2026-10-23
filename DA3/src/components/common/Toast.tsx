import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { ToastNotification } from '../../types/transit';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
        }[t.type];

        const borderClasses = {
          success: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
          info: 'border-sky-200 bg-sky-50/90 text-sky-950',
          warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
          error: 'border-rose-200 bg-rose-50/90 text-rose-950',
        }[t.type];

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClasses}`}
          >
            <div className="mt-0.5">{icons}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider">{t.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
