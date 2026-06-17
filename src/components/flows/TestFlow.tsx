import { useState } from "react";
import { useMock, type MeasurementRow, type DraftEvidence } from "@/lib/mock";
import { WORKFLOWS, progressFor } from "@/lib/workflows";
import { StepShell } from "./StepShell";
import { EvidencePicker, EvidenceGrid } from "@/components/EvidencePicker";
import { Plus, Trash2, Gauge, BookOpen } from "lucide-react";
import { toast } from "sonner";

const STEPS = WORKFLOWS.test.steps;

function verdictFor(value: string, low: string, high: string): MeasurementRow["verdict"] | undefined {
  const v = parseFloat(value), lo = parseFloat(low), hi = parseFloat(high);
  if (isNaN(v) || isNaN(lo) || isNaN(hi)) return undefined;
  const span = hi - lo;
  const margin = span * 0.05;
  if (v < lo - margin || v > hi + margin) return "kaldi";
  if (v < lo + margin || v > hi - margin) return "sinirda";
  return "gecti";
}

export function TestFlow({ workId, onReview, workTitle, workCode }: {
  workId: string; onReview: () => void; workTitle: string; workCode: string;
}) {
  const { getDraft, updateDraft, setStep, addLinkedRecord } = useMock();
  const draft = getDraft(workId)!;
  const tpl = (draft.template ?? {}) as Record<string, any>;
  const setTpl = (patch: Record<string, any>) => updateDraft(workId, { template: { ...tpl, ...patch } });

  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.id === (draft.currentStepId ?? STEPS[0].id)));
  const step = STEPS[stepIdx];
  const goto = (i: number) => setStep(workId, STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].id);
  const last = stepIdx === STEPS.length - 1;

  const measurements = draft.measurements ?? [];
  const setMeasurements = (m: MeasurementRow[]) => updateDraft(workId, { measurements: m });

  const [picker, setPicker] = useState<null | { stepId: string }>(null);
  const addEvidence = (e: DraftEvidence) => updateDraft(workId, { evidence: [...draft.evidence, e] });

  // Auto verdict on sonuc step
  const computeOverall = (): MeasurementRow["verdict"] | undefined => {
    if (measurements.length === 0) return undefined;
    if (measurements.some((m) => m.verdict === "kaldi")) return "kaldi";
    if (measurements.some((m) => m.verdict === "sinirda")) return "sinirda";
    return "gecti";
  };

  const body = (() => {
    switch (step.id) {
      case "tur":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Test türü ve prosedür</div>
            <input className="input" placeholder="Test türü (ör. Titreşim ölçümü)" value={tpl.testType ?? ""} onChange={(e) => setTpl({ testType: e.target.value })} />
            <input className="input" placeholder="Prosedür adı / kodu" value={tpl.procedureName ?? ""} onChange={(e) => setTpl({ procedureName: e.target.value })} />
            <button className="btn btn-ghost w-full" onClick={() => toast("Prosedür açıldı (demo)")}><BookOpen className="h-4 w-4" /> Prosedürü aç</button>
          </div>
        );
      case "kosullar":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Test koşulları</div>
            <textarea className="input" rows={4} placeholder="Ortam koşulları, makine durumu, ön hazırlık" value={tpl.conditions ?? ""} onChange={(e) => setTpl({ conditions: e.target.value })} />
          </div>
        );
      case "cihaz":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Ölçüm cihazı</div>
            <input className="input" placeholder="Cihaz adı" value={tpl.device ?? ""} onChange={(e) => setTpl({ device: e.target.value })} />
            <input className="input" placeholder="Seri numarası" value={tpl.deviceSerial ?? ""} onChange={(e) => setTpl({ deviceSerial: e.target.value })} />
            <input className="input" placeholder="Kalibrasyon tarihi" type="date" value={tpl.calibDate ?? ""} onChange={(e) => setTpl({ calibDate: e.target.value })} />
            <div className="flex gap-2">
              {["Geçerli", "Süresi yakın", "Geçersiz"].map((s) => (
                <button key={s} onClick={() => setTpl({ calibStatus: s })} className={`pill flex-1 justify-center ${tpl.calibStatus === s ? (s === "Geçersiz" ? "pill-danger" : s === "Süresi yakın" ? "pill-warning" : "pill-success") : ""}`}>{s}</button>
              ))}
            </div>
          </div>
        );
      case "referans":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Referans aralığı</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Referans değer" value={tpl.refValue ?? ""} onChange={(e) => setTpl({ refValue: e.target.value })} />
              <input className="input" placeholder="Birim" value={tpl.refUnit ?? ""} onChange={(e) => setTpl({ refUnit: e.target.value })} />
              <input className="input" placeholder="Alt sınır" value={tpl.refLow ?? ""} onChange={(e) => setTpl({ refLow: e.target.value })} />
              <input className="input" placeholder="Üst sınır" value={tpl.refHigh ?? ""} onChange={(e) => setTpl({ refHigh: e.target.value })} />
            </div>
          </div>
        );
      case "olcumler":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Ölçüm satırları</div>
            {measurements.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" placeholder="Değer" value={m.value} onChange={(e) => {
                    const v = verdictFor(e.target.value, tpl.refLow ?? "", tpl.refHigh ?? "");
                    setMeasurements(measurements.map((x) => x.id === m.id ? { ...x, value: e.target.value, verdict: v } : x));
                  }} />
                  <input className="input" type="datetime-local" value={m.at ?? ""} onChange={(e) => setMeasurements(measurements.map((x) => x.id === m.id ? { ...x, at: e.target.value } : x))} />
                </div>
                <input className="input" placeholder="Not" value={m.note ?? ""} onChange={(e) => setMeasurements(measurements.map((x) => x.id === m.id ? { ...x, note: e.target.value } : x))} />
                <div className="flex items-center justify-between">
                  {m.verdict ? <span className={`pill ${m.verdict === "gecti" ? "pill-success" : m.verdict === "sinirda" ? "pill-warning" : "pill-danger"}`}>{m.verdict === "gecti" ? "Geçti" : m.verdict === "sinirda" ? "Sınırda" : "Kaldı"}</span> : <span className="pill">Değer gir</span>}
                  <button onClick={() => setMeasurements(measurements.filter((x) => x.id !== m.id))} className="text-[12px] text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Sil</button>
                </div>
              </div>
            ))}
            <button onClick={() => setMeasurements([...measurements, { id: `m-${Date.now()}`, value: "", unit: tpl.refUnit, at: new Date().toISOString().slice(0, 16) }])} className="btn btn-ghost w-full"><Plus className="h-4 w-4" /> Ölçüm satırı ekle</button>
            <button onClick={() => setPicker({ stepId: "olcumler" })} className="btn btn-ghost w-full"><Gauge className="h-4 w-4" /> Kanıt ekle</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "olcumler")} />
          </div>
        );
      case "sonuc": {
        const auto = computeOverall();
        const verdict = tpl.verdict ?? auto;
        return (
          <div className="card-soft p-4 space-y-3">
            <div className="label">Otomatik sonuç</div>
            {auto ? (
              <span className={`pill ${auto === "gecti" ? "pill-success" : auto === "sinirda" ? "pill-warning" : "pill-danger"}`}>
                {auto === "gecti" ? "Geçti" : auto === "sinirda" ? "Sınırda" : "Kaldı"}
              </span>
            ) : <div className="text-sm text-muted-foreground">Önce ölçüm gir.</div>}
            <div>
              <div className="label mb-1">Onaylanan sonuç</div>
              <div className="flex gap-2">
                {(["gecti", "sinirda", "kaldi"] as const).map((v) => (
                  <button key={v} onClick={() => setTpl({ verdict: v })} className={`pill flex-1 justify-center ${verdict === v ? (v === "gecti" ? "pill-success" : v === "sinirda" ? "pill-warning" : "pill-danger") : ""}`}>{v === "gecti" ? "Geçti" : v === "sinirda" ? "Sınırda" : "Kaldı"}</button>
                ))}
              </div>
            </div>
            {verdict && verdict !== "gecti" && (
              <div className="rounded-2xl border border-border p-3 space-y-2">
                <div className="label">Sonraki adım</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-ghost" onClick={() => {
                    const rec = addLinkedRecord({ fromWorkId: workId, toCode: `ARZ-${Math.floor(Math.random() * 9000) + 1000}`, toType: "ariza", toTitle: `Test başarısız: ${tpl.testType ?? "Test"}`, relation: "bagli_ariza" });
                    toast.success(`${rec.toCode} oluşturuldu`);
                  }}>Bağlantılı arıza oluştur</button>
                  <button className="btn btn-ghost" onClick={() => {
                    const rec = addLinkedRecord({ fromWorkId: workId, toCode: `TST-${Math.floor(Math.random() * 9000) + 1000}`, toType: "test", toTitle: `Tekrar test: ${tpl.testType ?? "Test"}`, relation: "tekrar_test" });
                    setTpl({ retestDecision: "planlandı" });
                    toast.success(`${rec.toCode} planlandı`);
                  }}>Tekrar test planla</button>
                  <button className="btn btn-ghost" onClick={() => toast("Uzman desteği talebi taslağı oluşturuldu")}>Uzman desteği iste</button>
                  <button className="btn btn-ghost" onClick={() => { updateDraft(workId, { blocked: true }); toast("İş beklemeye alındı"); }}>İşi beklemeye al</button>
                </div>
              </div>
            )}
          </div>
        );
      }
      case "retest":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Tekrar test kararı</div>
            {tpl.verdict === "gecti" ? (
              <div className="pill pill-success">Tekrar teste gerek yok</div>
            ) : (
              <>
                <div className="flex gap-2">
                  {["planlandı", "gerekli değil", "uzman karar verecek"].map((d) => (
                    <button key={d} onClick={() => setTpl({ retestDecision: d })} className={`pill flex-1 justify-center capitalize ${tpl.retestDecision === d ? "pill-ink" : ""}`}>{d}</button>
                  ))}
                </div>
                <input type="date" className="input" placeholder="Tekrar test tarihi" value={tpl.retestDate ?? ""} onChange={(e) => setTpl({ retestDate: e.target.value })} />
              </>
            )}
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
      {picker && <EvidencePicker onAdd={(e) => addEvidence({ ...e, stepId: picker.stepId })} onClose={() => setPicker(null)} />}
    </>
  );
}
