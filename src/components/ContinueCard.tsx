import type { WorkDraft } from "@/lib/mock";
import { CheckCircle2, Circle } from "lucide-react";

export function ContinueCard({ draft, onContinue }: { draft: WorkDraft; onContinue: () => void }) {
  const steps = [
    { label: "İlk durum kanıtı", done: draft.evidence.some((e) => e.side === "once") },
    { label: "Müdahale", done: !!draft.intervention?.trim() },
    { label: "Sonuç kanıtı", done: draft.evidence.some((e) => e.side === "sonra") },
    { label: "Sesli kapanış", done: !!draft.voiceTranscript?.trim() },
  ];
  const completed = steps.filter((s) => s.done).length;
  const nextStep = steps.findIndex((s) => !s.done) + 1;
  const lastSaved = new Date(draft.lastSavedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-widest opacity-70">Kapanışa devam et</div>
        <div className="text-[11px] opacity-70">Son kayıt {lastSaved}</div>
      </div>
      <div className="font-bold text-lg mb-3">Kaldığın yerden devam et</div>
      <ul className="space-y-1.5 mb-4">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 opacity-50" />}
            <span className={s.done ? "" : "opacity-80"}>{i + 1}. {s.label}</span>
            {!s.done && i + 1 === nextStep && <span className="pill pill-primary ml-auto">Sıradaki</span>}
          </li>
        ))}
      </ul>
      <button onClick={onContinue} className="btn btn-primary w-full">
        {nextStep > 0 && nextStep <= 4 ? `${nextStep}. adımdan devam et` : "Kontrol et ve kapat"}
      </button>
      <div className="text-[11px] opacity-70 mt-2 text-center">{completed}/4 adım tamamlandı</div>
    </div>
  );
}
