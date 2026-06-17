import { useEffect, useState } from "react";
import { useMock, type ChecklistItem, type Finding, type DraftEvidence } from "@/lib/mock";
import { WORKFLOWS, progressFor } from "@/lib/workflows";
import { StepShell } from "./StepShell";
import { EvidencePicker, EvidenceGrid } from "@/components/EvidencePicker";
import { Plus, Trash2, AlertTriangle, BookOpen, Gauge, FileText, Camera } from "lucide-react";
import { toast } from "sonner";

const STEPS = WORKFLOWS.bakim.steps;
const TURLER = ["Periyodik", "Plansız", "Önleyici", "Kontrol amaçlı"];
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "c1", label: "Yağ seviyesi ve durumu" },
  { id: "c2", label: "Kayış / kaplin gerginliği" },
  { id: "c3", label: "Cıvata torkları" },
  { id: "c4", label: "Sensör ve kablolama" },
  { id: "c5", label: "Soğutma / havalandırma" },
  { id: "c6", label: "Yağlama ve gres" },
];

export function MaintenanceFlow({ workId, onReview, workTitle, workCode }: {
  workId: string; onReview: () => void; workTitle: string; workCode: string;
}) {
  const { getDraft, updateDraft, setStep, addLinkedRecord } = useMock();
  const draft = getDraft(workId)!;
  const tpl = (draft.template ?? {}) as Record<string, any>;
  const setTpl = (patch: Record<string, any>) => updateDraft(workId, { template: { ...tpl, ...patch } });

  // initialize checklist
  useEffect(() => {
    if (!draft.checklist || draft.checklist.length === 0) {
      updateDraft(workId, { checklist: DEFAULT_CHECKLIST });
    }
  }, [workId]);

  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.id === (draft.currentStepId ?? STEPS[0].id)));
  const step = STEPS[stepIdx];
  const goto = (i: number) => setStep(workId, STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].id);

  const [picker, setPicker] = useState<null | { side: "once" | "sirasinda" | "sonra"; stepId: string }>(null);
  const addEvidence = (e: DraftEvidence) => updateDraft(workId, { evidence: [...draft.evidence, e] });

  const checklist = draft.checklist ?? [];
  const setChecklist = (cl: ChecklistItem[]) => updateDraft(workId, { checklist: cl });
  const findings: Finding[] = draft.findings ?? [];
  const setFindings = (f: Finding[]) => updateDraft(workId, { findings: f });

  const last = stepIdx === STEPS.length - 1;
  const prog = progressFor(draft);

  const body = (() => {
    switch (step.id) {
      case "tur":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Bakım türü</div>
            <div className="grid grid-cols-2 gap-2">
              {TURLER.map((t) => (
                <button key={t} onClick={() => setTpl({ maintType: t })} className={`pill justify-center ${tpl.maintType === t ? "pill-ink" : ""}`}>{t}</button>
              ))}
            </div>
            <textarea className="input mt-2" placeholder="Bağlam / not (opsiyonel)" rows={3} value={tpl.maintNote ?? ""} onChange={(e) => setTpl({ maintNote: e.target.value })} />
          </div>
        );
      case "prosedur":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><div className="font-semibold">Prosedür: Periyodik Bakım — Konveyör Bandı</div></div>
            <div className="text-[12px] text-muted-foreground">Kaynak: Bakım Kılavuzu s.42 — Bölüm 3.4</div>
            <button onClick={() => { setTpl({ procRead: true }); toast.success("Prosedür açıldı (demo)"); }} className="btn btn-ghost w-full">
              <FileText className="h-4 w-4" /> Prosedürü aç
            </button>
            {tpl.procRead && <div className="pill pill-success">Okundu olarak işaretlendi</div>}
          </div>
        );
      case "checklist":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label mb-1">Kontrol listesi</div>
            {checklist.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border p-3">
                <div className="font-medium text-sm mb-2">{c.label}</div>
                <div className="grid grid-cols-3 gap-1">
                  {(["uygun", "sorun", "na"] as const).map((s) => {
                    const label = s === "uygun" ? "Uygun" : s === "sorun" ? "Sorun" : "Uygulanamaz";
                    const cls = c.status === s ? (s === "uygun" ? "pill-success" : s === "sorun" ? "pill-danger" : "pill-ink") : "";
                    return (
                      <button key={s} onClick={() => setChecklist(checklist.map((x) => x.id === c.id ? { ...x, status: s } : x))} className={`pill justify-center ${cls}`}>{label}</button>
                    );
                  })}
                </div>
                <input className="input mt-2" placeholder="Not (opsiyonel)" value={c.note ?? ""} onChange={(e) => setChecklist(checklist.map((x) => x.id === c.id ? { ...x, note: e.target.value } : x))} />
              </div>
            ))}
            <button onClick={() => setChecklist([...checklist, { id: `c-${Date.now()}`, label: "Yeni kontrol kalemi" }])} className="btn btn-ghost w-full"><Plus className="h-4 w-4" /> Kalem ekle</button>
          </div>
        );
      case "ilk_olcum":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">İlk ölçümler</div>
            <textarea className="input" rows={4} placeholder="Ör. Titreşim 1.8 mm/s, Sıcaklık 52°C" value={tpl.initialMeasurements ?? ""} onChange={(e) => setTpl({ initialMeasurements: e.target.value })} />
            <button onClick={() => setPicker({ side: "once", stepId: "ilk_olcum" })} className="btn btn-ghost w-full"><Gauge className="h-4 w-4" /> Ölçüm kanıtı ekle</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "ilk_olcum")} />
          </div>
        );
      case "islemler":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Yapılan bakım işlemleri</div>
            <textarea className="input" rows={5} placeholder="Adım adım yapılan işlemler" value={tpl.actions ?? ""} onChange={(e) => setTpl({ actions: e.target.value })} />
          </div>
        );
      case "sarflar":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Sarf malzemeleri ve parçalar</div>
            <textarea className="input" rows={3} placeholder="Ör. Gres 200g, Yağ 1L, Conta x2" value={tpl.consumables ?? ""} onChange={(e) => setTpl({ consumables: e.target.value })} />
          </div>
        );
      case "son_olcum":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Son ölçümler</div>
            <textarea className="input" rows={4} placeholder="Ör. Titreşim 0.7 mm/s, Sıcaklık 48°C" value={tpl.finalMeasurements ?? ""} onChange={(e) => setTpl({ finalMeasurements: e.target.value })} />
            <button onClick={() => setPicker({ side: "sonra", stepId: "son_olcum" })} className="btn btn-ghost w-full"><Gauge className="h-4 w-4" /> Ölçüm kanıtı ekle</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "son_olcum")} />
          </div>
        );
      case "bulgular":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Yeni bulgular / riskler</div>
            {findings.length === 0 && <div className="text-sm text-muted-foreground">Yeni bulgu yok — boş bırakabilirsin.</div>}
            {findings.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border p-3 space-y-2">
                <textarea className="input" rows={2} value={f.text} onChange={(e) => setFindings(findings.map((x) => x.id === f.id ? { ...x, text: e.target.value } : x))} />
                <div className="grid grid-cols-3 gap-1">
                  {(["ariza", "takip", "gozlem"] as const).map((a) => {
                    const label = a === "ariza" ? "Bağlantılı arıza" : a === "takip" ? "Takip işi" : "Gözlem";
                    return (
                      <button key={a} onClick={() => {
                        setFindings(findings.map((x) => x.id === f.id ? { ...x, action: a } : x));
                        if (a !== "gozlem") {
                          const rec = addLinkedRecord({
                            fromWorkId: workId,
                            toCode: a === "ariza" ? `ARZ-${Math.floor(Math.random() * 9000) + 1000}` : `TKP-${Math.floor(Math.random() * 9000) + 1000}`,
                            toType: a === "ariza" ? "ariza" : "diger",
                            toTitle: f.text.slice(0, 60) || (a === "ariza" ? "Bakım sırasında tespit edilen arıza" : "Bakım takip işi"),
                            relation: a === "ariza" ? "bagli_ariza" : "takip",
                          });
                          toast.success(`${rec.toCode} oluşturuldu`);
                        }
                      }} className={`pill justify-center ${f.action === a ? "pill-ink" : ""}`}>{label}</button>
                    );
                  })}
                </div>
                <button onClick={() => setFindings(findings.filter((x) => x.id !== f.id))} className="text-[12px] text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Sil</button>
              </div>
            ))}
            <button onClick={() => setFindings([...findings, { id: `f-${Date.now()}`, text: "" }])} className="btn btn-ghost w-full"><Plus className="h-4 w-4" /> Bulgu ekle</button>
          </div>
        );
      case "sonraki":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Sonraki bakım tarihi</div>
            <input type="date" className="input" value={tpl.nextDate ?? ""} onChange={(e) => setTpl({ nextDate: e.target.value })} />
            <div className="text-[12px] text-muted-foreground">Önerilen aralık: 30 gün</div>
          </div>
        );
    }
  })();

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
        nextDisabled={!step.done(draft) && step.id !== "bulgular" && step.id !== "prosedur"}
      >
        {body}
      </StepShell>
      <div className="mt-3 text-center text-[12px] text-muted-foreground">{prog.completed}/{prog.total} adım tamam</div>
      {picker && <EvidencePicker onAdd={(e) => addEvidence({ ...e, side: picker.side, stepId: picker.stepId })} onClose={() => setPicker(null)} />}
    </>
  );
}
