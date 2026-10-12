import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from './button';

export interface ToastOptions {
  message: string;
  /** Acción opcional, ej. "Deshacer". */
  action?: { label: string; onClick: () => void };
  /** Milisegundos hasta que se oculta solo (por defecto 5000). */
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  const show = useCallback((options: ToastOptions) => {
    clearTimeout(timer.current);
    setToast(options);
    timer.current = setTimeout(() => setToast(null), options.duration ?? 5000);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <span>{toast.message}</span>
            {toast.action && (
              <Button variant="ghost" onClick={() => { toast.action!.onClick(); dismiss(); }}>{toast.action.label}</Button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
