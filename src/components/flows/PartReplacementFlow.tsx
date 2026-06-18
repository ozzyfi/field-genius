import { useState } from "react";
import { useMock, type DraftEvidence } from "@/lib/mock";
import { WORKFLOWS, progressFor } from "@/lib/workflows";
import { StepShell } from "./StepShell";
import { EvidencePicker, EvidenceGrid } from "@/components/EvidencePicker";
import { PartPicker } from "@/components/Pickers";
import { Camera, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STEPS = WORKFLOWS.parca.steps;
const REASONS = ["Arıza", "Periyodik değişim", "Önleyici bakım", "Hasar", "Güncelleme"];
const DISPOSITIONS = ["Hurda", "Garanti", "Tamir", "Depoya iade", "Diğer"];

export function PartReplacementFlow({ workId, onReview, workTitle, workCode, onSupport }: {
  workId: string; onReview: () => void; workTitle: string; workCode: string; onSupport?: () => void;
}) {
  const { getDraft, updateDraft, setStep, addLinkedRecord } = useMock();
  const draft = getDraft(workId)!;
  const tpl = (draft.template ?? {}) as Record<string, any>;
  const setTpl = (patch: Record<string, any>) => updateDraft(workId, { template: { ...tpl, ...patch } });

  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.id === (draft.currentStepId ?? STEPS[0].id)));
  const step = STEPS[stepIdx];
  const goto = (i: number) => setStep(workId, STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].id);
  const last = stepIdx === STEPS.length - 1;

  const [picker, setPicker] = useState<null | { stepId: string; side: "once" | "sirasinda" | "sonra" }>(null);
  const [partPicker, setPartPicker] = useState<null | "removed" | "installed">(null);
  const addEvidence = (e: DraftEvidence) => updateDraft(workId, { evidence: [...draft.evidence, e] });

  const failed = tpl.funcTest === "kaldi";

  const body = (() => {
    switch (step.id) {
      case "sebep":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Değişim nedeni</div>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button key={r} onClick={() => setTpl({ reason: r })} className={`pill justify-center ${tpl.reason === r ? "pill-ink" : ""}`}>{r}</button>
              ))}
            </div>
            <textarea className="input mt-2" rows={3} placeholder="Açıklama (opsiyonel)" value={tpl.reasonNote ?? ""} onChange={(e) => setTpl({ reasonNote: e.target.value })} />
          </div>
        );
      case "sokulen":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Sökülen parça</div>
            <button onClick={() => setPartPicker("removed")} className="btn btn-ghost w-full justify-between">
              {tpl.removed ?? "Parça seç"} <span className="text-muted-foreground text-xs">{tpl.removedCode ?? ""}</span>
            </button>
            <input className="input" placeholder="Seri numarası" value={tpl.removedSerial ?? ""} onChange={(e) => setTpl({ removedSerial: e.target.value })} />
            <div className="flex gap-2">
              {["Aşınmış", "Kırık", "Korozyon", "Sağlam"].map((c) => (
                <button key={c} onClick={() => setTpl({ removedCondition: c })} className={`pill flex-1 justify-center ${tpl.removedCondition === c ? "pill-ink" : ""}`}>{c}</button>
              ))}
            </div>
            <button onClick={() => setPicker({ stepId: "sokulen", side: "once" })} className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Sökme öncesi/sonrası kanıt</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "sokulen")} />
          </div>
        );
      case "takilan":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Takılan parça</div>
            <button onClick={() => setPartPicker("installed")} className="btn btn-ghost w-full justify-between">
              {tpl.installed ?? "Parça seç"} <span className="text-muted-foreground text-xs">{tpl.installedCode ?? ""}</span>
            </button>
            <input className="input" placeholder="Seri numarası" value={tpl.installedSerial ?? ""} onChange={(e) => setTpl({ installedSerial: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Adet" value={tpl.qty ?? ""} onChange={(e) => setTpl({ qty: e.target.value })} />
              <input className="input" placeholder="Kaynak (depo/satıcı)" value={tpl.source ?? ""} onChange={(e) => setTpl({ source: e.target.value })} />
            </div>
            <button onClick={() => setPicker({ stepId: "takilan", side: "sirasinda" })} className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Yeni parça kanıtı</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "takilan")} />
          </div>
        );
      case "aksiyon":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Kurulum işlemleri</div>
            <textarea className="input" rows={5} placeholder="Sökme, takma, ayar, tork değerleri..." value={tpl.installActions ?? ""} onChange={(e) => setTpl({ installActions: e.target.value })} />
          </div>
        );
      case "test":
        return (
          <div className="card-soft p-4 space-y-3">
            <div className="label">Fonksiyon testi</div>
            <input className="input" placeholder="Test prosedürü" value={tpl.funcProcedure ?? ""} onChange={(e) => setTpl({ funcProcedure: e.target.value })} />
            <input className="input" placeholder="Ölçüm değeri" value={tpl.funcMeasurement ?? ""} onChange={(e) => setTpl({ funcMeasurement: e.target.value })} />
            <div className="flex gap-2">
              {(["gecti", "kaldi"] as const).map((r) => (
                <button key={r} onClick={() => setTpl({ funcTest: r })} className={`pill flex-1 justify-center ${tpl.funcTest === r ? (r === "gecti" ? "pill-success" : "pill-danger") : ""}`}>{r === "gecti" ? "Geçti" : "Kaldı"}</button>
              ))}
            </div>
            <button onClick={() => setPicker({ stepId: "test", side: "sonra" })} className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Test kanıtı</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "test")} />
            {failed && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Fonksiyon testi geçmedi</div>
                <div className="text-[13px]">İş tamamlanamaz. Aşağıdaki adımlardan birini seç:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-ghost" onClick={() => { updateDraft(workId, { blocked: false }); setTpl({ revert: true }); toast("Kurulum geri alındı"); }}>Kurulumu geri al</button>
                  <button className="btn btn-ghost" onClick={() => toast("Uzman desteği talebi taslağı oluşturuldu")}>Uzman desteği iste</button>
                  <button className="btn btn-ghost" onClick={() => toast("Başka parça talebi oluşturuldu")}>Başka parça iste</button>
                  <button className="btn btn-ghost" onClick={() => {
                    const r = addLinkedRecord({ fromWorkId: workId, toCode: `ARZ-${Math.floor(Math.random() * 9000) + 1000}`, toType: "ariza", toTitle: "Parça değişimi sonrası arıza", relation: "bagli_ariza" });
                    toast.success(`${r.toCode} oluşturuldu`);
                  }}>Bağlantılı arıza</button>
                  <button className="btn btn-danger col-span-2" onClick={() => { updateDraft(workId, { blocked: true }); toast("İş bloklandı"); }}>İşi bloklu tut</button>
                </div>
              </div>
            )}
          </div>
        );
      case "imha":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Eski parça akıbeti</div>
            <div className="grid grid-cols-2 gap-2">
              {DISPOSITIONS.map((d) => (
                <button key={d} onClick={() => setTpl({ disposition: d })} className={`pill justify-center ${tpl.disposition === d ? "pill-ink" : ""}`}>{d}</button>
              ))}
            </div>
            <textarea className="input mt-2" rows={2} placeholder="Not (opsiyonel)" value={tpl.dispositionNote ?? ""} onChange={(e) => setTpl({ dispositionNote: e.target.value })} />
          </div>
        );
    }
  })();

  const prog = progressFor(draft);
  return (
    <>
      <StepShell
        index={stepIdx} total={STEPS.length}
        title={step.label}
        subtitle={`${workCode} • ${workTitle}`}
        onPrev={stepIdx > 0 ? () => goto(stepIdx - 1) : undefined}
        onNext={!last ? () => goto(stepIdx + 1) : undefined}
        onReview={last ? onReview : undefined}
        showReview={last}
      >
        {body}
      </StepShell>
      <div className="mt-3 text-center text-[12px] text-muted-foreground">{prog.completed}/{prog.total} adım tamam</div>
      {picker && <EvidencePicker onAdd={(e) => addEvidence({ ...e, side: picker.side, stepId: picker.stepId })} onClose={() => setPicker(null)} />}
      {partPicker && (
        <PartPicker
          onClose={() => setPartPicker(null)}
          onPick={(p) => {
            if (partPicker === "removed") setTpl({ removed: p.name, removedCode: p.code });
            else setTpl({ installed: p.name, installedCode: p.code });
            setPartPicker(null);
          }}
        />
      )}
    </>
  );
}
