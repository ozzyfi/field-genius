import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useMock } from "@/lib/mock";

export function FocusSheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const { setFocus } = useMock();
  useEffect(() => { setFocus(true); return () => setFocus(false); }, [setFocus]);
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="px-4 h-14 border-b border-border flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2 tap" aria-label="Kapat">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md w-full mx-auto">{children}</div>
      {footer && <div className="border-t border-border p-3 max-w-md w-full mx-auto">{footer}</div>}
    </div>
  );
}

export function BottomSheet({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl p-4 max-w-md mx-auto max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto h-1 w-10 bg-border rounded-full mb-3" />
        {title && <div className="font-semibold mb-3">{title}</div>}
        {children}
      </div>
    </div>
  );
}
