import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

export function StepShell({
  index, total, title, subtitle, children,
  onPrev, onNext, onReview, nextDisabled,
  nextLabel = "Sonraki adım", reviewLabel = "Kontrol et ve kapat",
  showReview,
}: {
  index: number; total: number; title: string; subtitle?: string;
  children: ReactNode;
  onPrev?: () => void; onNext?: () => void; onReview?: () => void;
  nextDisabled?: boolean; nextLabel?: string; reviewLabel?: string;
  showReview?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Adım {index + 1} / {total}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1.5 w-4 rounded-full ${i <= index ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
        <div className="font-bold text-lg leading-tight">{title}</div>
        {subtitle && <div className="text-[13px] text-muted-foreground mt-1">{subtitle}</div>}
      </div>

      <div className="space-y-3">{children}</div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button onClick={onPrev} disabled={!onPrev} className="btn btn-ghost disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Önceki
        </button>
        {showReview ? (
          <button onClick={onReview} className="btn btn-primary"><ShieldCheck className="h-4 w-4" /> {reviewLabel}</button>
        ) : (
          <button onClick={onNext} disabled={nextDisabled} className="btn btn-primary disabled:opacity-50">
            {nextLabel} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
