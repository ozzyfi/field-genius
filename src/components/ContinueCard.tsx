import { useMock, type WorkDraft, type WorkflowStatus } from "@/lib/mock";
import { progressFor, WORKFLOWS } from "@/lib/workflows";
import { CheckCircle2, Circle, LifeBuoy } from "lucide-react";

type Target = { stepId?: string | null; mode: "step" | "review" | "support" | "punch" | "completed" };

export function continueTarget(draft: WorkDraft): Target {
  if (draft.workflowStatus === "tamamlandi") return { mode: "completed" };
  if (draft.support && !draft.support.resolved) return { mode: "support" };
  if (draft.workflowStatus === "kismi_tamamlandi") return { mode: "punch" };
  const prog = progressFor(draft);
  if (prog.firstIncompleteStepId) return { mode: "step", stepId: prog.firstIncompleteStepId };
  return { mode: "review" };
}

function ctaLabel(draft: WorkDraft, target: Target): string {
  if (target.mode === "support") return "Bekleme durumunu aç";
  if (target.mode === "review") return "Kontrol et ve kapat";
  if (target.mode === "punch") return "Açık kalemleri tamamla";
  const wf = WORKFLOWS[draft.workType ?? "ariza"];
  const step = wf.steps.find((s) => s.id === target.stepId);
  if (!step) return "Kaldığın yerden devam et";
  // friendly contextual labels
  const lbl = step.label.toLowerCase();
  if (lbl.includes("son ölçüm")) return "Son ölçümlere devam et";
  if (lbl.includes("sonuç")) return "Test sonucunu değerlendir";
  if (lbl.includes("devreye")) return "Devreye almaya devam et";
  return `${step.label} adımına devam et`;
}

export function ContinueCard({ draft, onContinue }: { draft: WorkDraft; onContinue: (stepId?: string | null, mode?: Target["mode"]) => void }) {
  const prog = progressFor(draft);
  const target = continueTarget(draft);
  const lastSaved = new Date(draft.lastSavedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const supportPending = draft.support && !draft.support.resolved;

  return (
    <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-widest opacity-70">
          {supportPending ? "Destek bekleniyor" : "Kapanışa devam et"}
        </div>
        <div className="text-[11px] opacity-70">Son kayıt {lastSaved}</div>
      </div>
      <div className="font-bold text-lg mb-3">{supportPending ? "Talebe yanıt bekliyor" : "Kaldığın yerden devam et"}</div>
      {supportPending ? (
        <div className="rounded-2xl bg-surface/10 p-3 mb-3 text-sm flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-primary" />
          <span className="opacity-90">Bu işte aktif bir destek talebi var. Çözülünce tam olarak kaldığın adımdan devam edersin.</span>
        </div>
      ) : (
        <ul className="space-y-1.5 mb-4">
          {prog.items.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 opacity-50" />}
              <span className={s.done ? "" : "opacity-80"}>{i + 1}. {s.label}</span>
              {!s.done && prog.firstIncompleteStepId === s.id && <span className="pill pill-primary ml-auto">Sıradaki</span>}
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => onContinue(target.stepId, target.mode)} className="btn btn-primary w-full">
        {ctaLabel(draft, target)}
      </button>
      <div className="text-[11px] opacity-70 mt-2 text-center">{prog.completed}/{prog.total} adım tamamlandı</div>
    </div>
  );
}
