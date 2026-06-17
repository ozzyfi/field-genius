import { useState } from "react";
import { useMock, type PunchItem, type DraftEvidence } from "@/lib/mock";
import { WORKFLOWS, progressFor } from "@/lib/workflows";
import { StepShell } from "./StepShell";
import { EvidencePicker, EvidenceGrid } from "@/components/EvidencePicker";
import { Plus, Trash2, Camera, QrCode } from "lucide-react";
import { toast } from "sonner";

const STEPS = WORKFLOWS.kurulum.steps;

export function InstallationFlow({ workId, onReview, workTitle, workCode }: {
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

  const punch = draft.punchList ?? [];
  const setPunch = (p: PunchItem[]) => updateDraft(workId, { punchList: p });

  const [picker, setPicker] = useState<null | { stepId: string }>(null);
  const addEvidence = (e: DraftEvidence) => updateDraft(workId, { evidence: [...draft.evidence, e] });

  const body = (() => {
    switch (step.id) {
      case "saha":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Saha uygunluk kontrolü</div>
            <textarea className="input" rows={4} placeholder="Zemin, elektrik altyapısı, alan, erişim..." value={tpl.siteCheck ?? ""} onChange={(e) => setTpl({ siteCheck: e.target.value })} />
            <button onClick={() => setPicker({ stepId: "saha" })} className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Saha fotoğrafı ekle</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "saha")} />
          </div>
        );
      case "kimlik":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Ekipman kimliği</div>
            <input className="input" placeholder="Ekipman adı" value={tpl.equipment ?? ""} onChange={(e) => setTpl({ equipment: e.target.value })} />
            <input className="input" placeholder="Model" value={tpl.model ?? ""} onChange={(e) => setTpl({ model: e.target.value })} />
            <input className="input" placeholder="Seri numarası" value={tpl.serial ?? ""} onChange={(e) => setTpl({ serial: e.target.value })} />
            <button onClick={() => setPicker({ stepId: "kimlik" })} className="btn btn-ghost w-full"><QrCode className="h-4 w-4" /> QR / etiket fotoğrafı</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "kimlik")} />
          </div>
        );
      case "lokasyon":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Kurulum lokasyonu</div>
            <input className="input" placeholder="Tesis / Bina / Kat / Alan" value={tpl.instLocation ?? ""} onChange={(e) => setTpl({ instLocation: e.target.value })} />
          </div>
        );
      case "mekanik":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Mekanik montaj kontrolü</div>
            {["Şase sabitleme", "Hizalama", "Cıvata torkları", "Bağlantı elemanları"].map((it) => (
              <label key={it} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={!!tpl[`mek_${it}`]} onChange={(e) => setTpl({ [`mek_${it}`]: e.target.checked })} />{it}</label>
            ))}
            <button onClick={() => setTpl({ mechDone: true })} className="btn btn-primary w-full mt-2">Mekanik montaj tamam</button>
            {tpl.mechDone && <div className="pill pill-success">Tamamlandı</div>}
          </div>
        );
      case "elektrik":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Elektrik ve kontrol bağlantıları</div>
            {["Topraklama", "Güç hattı", "Sinyal kabloları", "Kontrol panosu"].map((it) => (
              <label key={it} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={!!tpl[`el_${it}`]} onChange={(e) => setTpl({ [`el_${it}`]: e.target.checked })} />{it}</label>
            ))}
            <button onClick={() => setTpl({ elecDone: true })} className="btn btn-primary w-full mt-2">Elektrik bağlantıları tamam</button>
            {tpl.elecDone && <div className="pill pill-success">Tamamlandı</div>}
          </div>
        );
      case "yazilim":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Yazılım / parametre kurulumu</div>
            <textarea className="input" rows={3} placeholder="Yüklenen yazılım sürümü, parametreler" value={tpl.swDetail ?? ""} onChange={(e) => setTpl({ swDetail: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTpl({ swDone: true, swNotApplicable: false })} className={`pill justify-center ${tpl.swDone ? "pill-success" : ""}`}>Yüklendi</button>
              <button onClick={() => setTpl({ swNotApplicable: true, swDone: false })} className={`pill justify-center ${tpl.swNotApplicable ? "pill-ink" : ""}`}>Uygulanamaz</button>
            </div>
          </div>
        );
      case "devreye":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Devreye alma adımları</div>
            <textarea className="input" rows={4} placeholder="Devreye alma sırasında yapılanlar" value={tpl.commissioning ?? ""} onChange={(e) => setTpl({ commissioning: e.target.value })} />
          </div>
        );
      case "olcum":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Devreye alma ölçümleri ve testi</div>
            <textarea className="input" rows={3} placeholder="Ölçüm değerleri" value={tpl.commMeasurements ?? ""} onChange={(e) => setTpl({ commMeasurements: e.target.value })} />
            <div className="flex gap-2">
              {(["gecti", "kaldi"] as const).map((r) => (
                <button key={r} onClick={() => setTpl({ commTestResult: r })} className={`pill flex-1 justify-center ${tpl.commTestResult === r ? (r === "gecti" ? "pill-success" : "pill-danger") : ""}`}>{r === "gecti" ? "Geçti" : "Kaldı"}</button>
              ))}
            </div>
            <button onClick={() => setPicker({ stepId: "olcum" })} className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Test kanıtı ekle</button>
            <EvidenceGrid items={draft.evidence.filter((e) => e.stepId === "olcum")} />
          </div>
        );
      case "teslim":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Teslim</div>
            <input className="input" placeholder="Teslim alan kişi" value={tpl.handover ?? ""} onChange={(e) => setTpl({ handover: e.target.value })} />
            <input className="input" placeholder="Departman" value={tpl.handoverDept ?? ""} onChange={(e) => setTpl({ handoverDept: e.target.value })} />
            <input className="input" type="date" value={tpl.handoverDate ?? ""} onChange={(e) => setTpl({ handoverDate: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={!!tpl.trainingDone} onChange={(e) => setTpl({ trainingDone: e.target.checked })} />Kullanıcı eğitimi tamamlandı</label>
          </div>
        );
      case "punch":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Punch list (açık kalan kalemler)</div>
            {punch.length === 0 && <div className="text-sm text-muted-foreground">Açık kalem yok.</div>}
            {punch.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border p-3 space-y-2">
                <input className="input" placeholder="Kalem" value={p.text} onChange={(e) => setPunch(punch.map((x) => x.id === p.id ? { ...x, text: e.target.value } : x))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" placeholder="Sorumlu" value={p.owner ?? ""} onChange={(e) => setPunch(punch.map((x) => x.id === p.id ? { ...x, owner: e.target.value } : x))} />
                  <input type="date" className="input" value={p.due ?? ""} onChange={(e) => setPunch(punch.map((x) => x.id === p.id ? { ...x, due: e.target.value } : x))} />
                </div>
                <div className="flex justify-between items-center">
                  <button onClick={() => {
                    const rec = addLinkedRecord({ fromWorkId: workId, toCode: `TKP-${Math.floor(Math.random() * 9000) + 1000}`, toType: "diger", toTitle: p.text || "Kurulum takip işi", relation: "takip" });
                    toast.success(`${rec.toCode} oluşturuldu`);
                  }} className="text-[12px] underline">Takip işi oluştur</button>
                  <button onClick={() => setPunch(punch.filter((x) => x.id !== p.id))} className="text-[12px] text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Sil</button>
                </div>
              </div>
            ))}
            <button onClick={() => setPunch([...punch, { id: `pu-${Date.now()}`, text: "" }])} className="btn btn-ghost w-full"><Plus className="h-4 w-4" /> Kalem ekle</button>
          </div>
        );
      case "durum":
        return (
          <div className="card-soft p-4 space-y-2">
            <div className="label">Tamamlanma durumu</div>
            <div className="flex gap-2">
              {([{ k: "tam", l: "Tamamlandı" }, { k: "kismi", l: "Kısmi tamamlandı" }, { k: "bekliyor", l: "Devreye alma bekliyor" }] as const).map((s) => (
                <button key={s.k} onClick={() => setTpl({ completionStatus: s.k })} className={`pill flex-1 justify-center text-center ${tpl.completionStatus === s.k ? "pill-ink" : ""}`}>{s.l}</button>
              ))}
            </div>
            {tpl.completionStatus === "tam" && tpl.commTestResult !== "gecti" && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-[13px]">
                Devreye alma testi geçmedi. "Tamamlandı" seçemezsin — "Kısmi" veya "Bekliyor" işaretle.
              </div>
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
