import { useMock } from "@/lib/mock";

export type WorkType = "ariza" | "bakim" | "test" | "kurulum" | "parca" | "diger";

export function CompletionTemplate({ workId, type }: { workId: string; type: WorkType }) {
  const { getDraft, updateDraft } = useMock();
  const draft = getDraft(workId);
  const tpl = (draft?.template ?? {}) as Record<string, any>;
  const set = (k: string, v: any) => updateDraft(workId, { template: { ...tpl, [k]: v } });

  function Field({ k, label, type = "text", rows }: { k: string; label: string; type?: string; rows?: number }) {
    if (rows) return (
      <div><label className="label block mb-1">{label}</label>
        <textarea className="input" rows={rows} value={tpl[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></div>
    );
    return (
      <div><label className="label block mb-1">{label}</label>
        <input className="input" type={type} value={tpl[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></div>
    );
  }
  function Check({ k, label }: { k: string; label: string }) {
    return <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={!!tpl[k]} onChange={(e) => set(k, e.target.checked)} />{label}</label>;
  }

  if (type === "ariza") return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Arıza / Onarım kapanışı</div>
      <Field k="symptom" label="Belirti" rows={2} />
      <Field k="initial" label="İlk durum" rows={2} />
      <Field k="rootCause" label="Kök neden" rows={2} />
      <div>
        <label className="label block mb-1">Kök neden durumu</label>
        <div className="flex gap-2">
          {(["kesin", "tahmini", "bilinmiyor"] as const).map((s) => (
            <button key={s} onClick={() => set("rootCauseStatus", s)} className={`pill flex-1 justify-center capitalize ${tpl.rootCauseStatus === s ? "pill-ink" : ""}`}>{s}</button>
          ))}
        </div>
      </div>
      <Field k="intervention" label="Müdahale" rows={3} />
      <Field k="parts" label="Kullanılan parçalar" />
      <Field k="result" label="Sonuç" rows={2} />
      <Field k="followUp" label="Takip ihtiyacı" />
    </div>
  );

  if (type === "bakim") return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Bakım kapanışı</div>
      <Field k="maintType" label="Bakım türü" />
      <div className="space-y-1">
        <div className="label">Kontrol listesi</div>
        <Check k="ck1" label="Yağ seviyesi kontrol edildi" />
        <Check k="ck2" label="Kayış gerginliği kontrol edildi" />
        <Check k="ck3" label="Cıvata torkları kontrol edildi" />
        <Check k="ck4" label="Sensörler temizlendi" />
      </div>
      <Field k="actions" label="Yapılan işlemler" rows={3} />
      <Field k="consumables" label="Sarf malzemeler" />
      <Field k="measurements" label="Ölçümler" rows={2} />
      <Field k="newRisks" label="Tespit edilen yeni riskler" rows={2} />
      <Field k="nextDate" label="Sonraki bakım tarihi" type="date" />
    </div>
  );

  if (type === "test") return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Test / Kontrol kapanışı</div>
      <Field k="testType" label="Test türü" />
      <div className="grid grid-cols-2 gap-2">
        <Field k="refValue" label="Referans" />
        <Field k="measured" label="Ölçülen" />
        <Field k="unit" label="Birim" />
        <Field k="deviation" label="Sapma" />
      </div>
      <div>
        <label className="label block mb-1">Sonuç</label>
        <div className="flex gap-2">
          {(["Geçti", "Kaldı"] as const).map((r) => (
            <button key={r} onClick={() => set("passFail", r)} className={`pill flex-1 justify-center ${tpl.passFail === r ? (r === "Geçti" ? "pill-success" : "pill-danger") : ""}`}>{r}</button>
          ))}
        </div>
      </div>
      <Check k="retest" label="Tekrar test gerekli" />
    </div>
  );

  if (type === "kurulum") return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Kurulum kapanışı</div>
      <Field k="equipment" label="Kurulan ekipman" />
      <div className="grid grid-cols-2 gap-2">
        <Field k="model" label="Model" />
        <Field k="serial" label="Seri No" />
      </div>
      <Field k="instLocation" label="Kurulum lokasyonu" />
      <div className="space-y-1">
        <div className="label">Kurulum kontrol listesi</div>
        <Check k="i1" label="Mekanik bağlantılar" />
        <Check k="i2" label="Elektrik bağlantıları" />
        <Check k="i3" label="Yazılım/parametre yüklendi" />
        <Check k="i4" label="Devreye alma testi geçti" />
      </div>
      <Field k="handover" label="Teslim alan kişi" />
      <Field k="punch" label="Açık kalan kalemler" rows={2} />
    </div>
  );

  if (type === "parca") return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Parça değişimi kapanışı</div>
      <div className="grid grid-cols-2 gap-2">
        <Field k="removed" label="Sökülen parça" />
        <Field k="installed" label="Takılan parça" />
        <Field k="partCode" label="Parça kodu" />
        <Field k="partSerial" label="Seri No" />
        <Field k="qty" label="Adet" />
        <Field k="reason" label="Değişim nedeni" />
      </div>
      <Field k="oldEvidence" label="Eski parça kanıtı (not)" />
      <Field k="newEvidence" label="Yeni parça kanıtı (not)" />
      <div>
        <label className="label block mb-1">Fonksiyon testi</label>
        <div className="flex gap-2">
          {(["Geçti", "Kaldı"] as const).map((r) => (
            <button key={r} onClick={() => set("funcTest", r)} className={`pill flex-1 justify-center ${tpl.funcTest === r ? (r === "Geçti" ? "pill-success" : "pill-danger") : ""}`}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="card-soft p-4 space-y-3">
      <div className="font-semibold">Genel kapanış</div>
      <Field k="summary" label="Özet" rows={4} />
    </div>
  );
}

export function templateMissing(type: WorkType, tpl: Record<string, any>): string[] {
  switch (type) {
    case "ariza": return ["intervention", "result"].filter((k) => !String(tpl[k] ?? "").trim()).map((k) => k === "intervention" ? "Müdahale" : "Sonuç");
    case "bakim": return ["actions", "nextDate"].filter((k) => !String(tpl[k] ?? "").trim()).map((k) => k === "actions" ? "Yapılan işlemler" : "Sonraki bakım tarihi");
    case "test": return ["measured", "passFail"].filter((k) => !String(tpl[k] ?? "").trim()).map((k) => k === "measured" ? "Ölçülen değer" : "Geçti/Kaldı");
    case "kurulum": return ["equipment", "handover"].filter((k) => !String(tpl[k] ?? "").trim()).map((k) => k === "equipment" ? "Kurulan ekipman" : "Teslim alan");
    case "parca": return ["removed", "installed", "funcTest"].filter((k) => !String(tpl[k] ?? "").trim()).map((k) => k === "funcTest" ? "Fonksiyon testi" : k === "removed" ? "Sökülen parça" : "Takılan parça");
    default: return [];
  }
}
