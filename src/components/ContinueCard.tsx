import { useMock, type WorkDraft } from "@/lib/mock";
import { progressFor } from "@/lib/workflows";
import { CheckCircle2, Circle } from "lucide-react";

export function ContinueCard({ draft, onContinue }: { draft: WorkDraft; onContinue: (stepId?: string | null) => void }) {
  const prog = progressFor(draft);
  const lastSaved = new Date(draft.lastSavedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-widest opacity-70">Kapanışa devam et</div>
        <div className="text-[11px] opacity-70">Son kayıt {lastSaved}</div>
      </div>
      <div className="font-bold text-lg mb-3">Kaldığın yerden devam et</div>
      <ul className="space-y-1.5 mb-4">
        {prog.items.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 opacity-50" />}
            <span className={s.done ? "" : "opacity-80"}>{i + 1}. {s.label}</span>
            {!s.done && prog.firstIncompleteStepId === s.id && <span className="pill pill-primary ml-auto">Sıradaki</span>}
          </li>
        ))}
      </ul>
      <button onClick={() => onContinue(prog.firstIncompleteStepId)} className="btn btn-primary w-full">
        {prog.firstIncompleteStepId ? "Sıradaki adımdan devam et" : "Kontrol et ve kapat"}
      </button>
      <div className="text-[11px] opacity-70 mt-2 text-center">{prog.completed}/{prog.total} adım tamamlandı</div>
    </div>
  );
}
