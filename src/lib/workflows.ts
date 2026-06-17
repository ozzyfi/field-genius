import { CheckCircle2, Sparkles, LifeBuoy, Wrench, BookOpen, ClipboardCheck, FileText, PackagePlus, Replace, AlertOctagon } from "lucide-react";
import type { WorkDraft } from "./mock";

export type WorkType = "ariza" | "bakim" | "test" | "kurulum" | "parca" | "diger";

export type StepDef = {
  id: string;
  label: string;
  done: (draft: WorkDraft) => boolean;
};

export type PathOption = {
  k: "fast" | "ai" | "support" | "procedure";
  icon: any;
  title: string;
  desc: string;
  dark?: boolean;
};

const t = (d: WorkDraft) => (d.template ?? {}) as Record<string, any>;

export const WORKFLOWS: Record<WorkType, { steps: StepDef[]; requiresVoice: boolean; pathOptions: PathOption[] }> = {
  ariza: {
    requiresVoice: true,
    pathOptions: [
      { k: "fast", icon: CheckCircle2, title: "Sorunu biliyorum", desc: "Hızlı kapanış: ilk kanıt → sesli anlat → son kanıt → ToolA özeti.", dark: true },
      { k: "ai", icon: Sparkles, title: "ToolA ile teşhis et", desc: "Adım adım kontrol, kaynak ve benzer vakalarla ilerle." },
      { k: "support", icon: LifeBuoy, title: "Destek / parça gerekli", desc: "Parça bekle, uzmanı çağır ya da devret." },
    ],
    steps: [
      { id: "ilk_kanit", label: "İlk durum kanıtı", done: (d) => d.evidence.some((e) => e.side === "once") },
      { id: "ses", label: "Sesli anlatım", done: (d) => !!d.voiceTranscript?.trim() },
      { id: "son_kanit", label: "Sonuç kanıtı", done: (d) => d.evidence.some((e) => e.side === "sonra") },
      { id: "ozet", label: "ToolA özeti", done: (d) => !!t(d).intervention && !!t(d).result },
    ],
  },

  bakim: {
    requiresVoice: false,
    pathOptions: [
      { k: "fast", icon: Wrench, title: "Bakıma başla", desc: "Adım adım: prosedür, checklist, ölçüm, kapanış.", dark: true },
      { k: "procedure", icon: BookOpen, title: "Bakım prosedürünü aç", desc: "Üretici/kurum prosedürünü oku, sonra başla." },
      { k: "support", icon: LifeBuoy, title: "Destek / parça gerekli", desc: "Sarf/parça bekle ya da uzman çağır." },
    ],
    steps: [
      { id: "tur", label: "Bakım türü", done: (d) => !!t(d).maintType },
      { id: "prosedur", label: "Prosedür", done: (d) => !!t(d).procRead },
      { id: "checklist", label: "Checklist", done: (d) => (d.checklist?.length ?? 0) > 0 && (d.checklist ?? []).every((c) => !!c.status) },
      { id: "ilk_olcum", label: "İlk ölçümler", done: (d) => !!t(d).initialMeasurements || (d.measurements ?? []).some((m) => (m as any).phase === "ilk") },
      { id: "islemler", label: "Yapılan işlemler", done: (d) => !!t(d).actions?.toString().trim() },
      { id: "sarflar", label: "Sarf / parça", done: (d) => !!t(d).consumables?.toString().trim() },
      { id: "son_olcum", label: "Son ölçümler", done: (d) => !!t(d).finalMeasurements || (d.measurements ?? []).some((m) => (m as any).phase === "son") },
      { id: "bulgular", label: "Yeni bulgular", done: (d) => (d.findings ?? []).every((f) => !!f.action) },
      { id: "sonraki", label: "Sonraki bakım", done: (d) => !!t(d).nextDate },
    ],
  },

  test: {
    requiresVoice: false,
    pathOptions: [
      { k: "fast", icon: ClipboardCheck, title: "Testi başlat", desc: "Cihaz, referans, ölçüm ve sonuç adımları.", dark: true },
      { k: "procedure", icon: BookOpen, title: "Test prosedürünü aç", desc: "Geçerli test prosedürünü incele." },
      { k: "support", icon: LifeBuoy, title: "Destek gerekli", desc: "Uzman desteği veya başka ekip iste." },
    ],
    steps: [
      { id: "tur", label: "Test türü ve prosedür", done: (d) => !!t(d).testType },
      { id: "kosullar", label: "Test koşulları", done: (d) => !!t(d).conditions },
      { id: "cihaz", label: "Ölçüm cihazı", done: (d) => !!t(d).device && !!t(d).deviceSerial },
      { id: "referans", label: "Referans aralığı", done: (d) => !!t(d).refValue && !!t(d).refLow && !!t(d).refHigh },
      { id: "olcumler", label: "Ölçümler", done: (d) => (d.measurements ?? []).length > 0 },
      { id: "sonuc", label: "Sonuç", done: (d) => !!t(d).verdict },
      { id: "retest", label: "Tekrar test kararı", done: (d) => !!t(d).retestDecision || t(d).verdict === "gecti" },
    ],
  },

  kurulum: {
    requiresVoice: false,
    pathOptions: [
      { k: "fast", icon: PackagePlus, title: "Kuruluma başla", desc: "Saha, montaj, devreye alma, teslim.", dark: true },
      { k: "procedure", icon: BookOpen, title: "Kurulum talimatını aç", desc: "Üretici kurulum talimatını incele." },
      { k: "support", icon: LifeBuoy, title: "Destek / eksik malzeme", desc: "Eksik parça/destek talebi oluştur." },
    ],
    steps: [
      { id: "saha", label: "Saha uygunluk", done: (d) => !!t(d).siteCheck },
      { id: "kimlik", label: "Ekipman kimliği", done: (d) => !!t(d).equipment && !!t(d).model && !!t(d).serial },
      { id: "lokasyon", label: "Kurulum lokasyonu", done: (d) => !!t(d).instLocation },
      { id: "mekanik", label: "Mekanik montaj", done: (d) => !!t(d).mechDone },
      { id: "elektrik", label: "Elektrik / kontrol", done: (d) => !!t(d).elecDone },
      { id: "yazilim", label: "Yazılım / parametre", done: (d) => !!t(d).swDone || t(d).swNotApplicable },
      { id: "devreye", label: "Devreye alma", done: (d) => !!t(d).commissioning },
      { id: "olcum", label: "Devreye alma ölçümleri", done: (d) => !!t(d).commTestResult },
      { id: "teslim", label: "Teslim", done: (d) => !!t(d).handover && !!t(d).handoverDept },
      { id: "punch", label: "Punch list", done: (d) => (d.punchList ?? []).length === 0 || (d.punchList ?? []).every((p) => !!p.owner && !!p.due) },
      { id: "durum", label: "Tamamlanma durumu", done: (d) => !!t(d).completionStatus },
    ],
  },

  parca: {
    requiresVoice: false,
    pathOptions: [
      { k: "fast", icon: Replace, title: "Parça değişimine başla", desc: "Sökme, takma, fonksiyon testi, kapanış.", dark: true },
      { k: "procedure", icon: BookOpen, title: "Parça / prosedür bilgisi", desc: "Parça kataloğu ve değişim prosedürü." },
      { k: "support", icon: LifeBuoy, title: "Destek gerekli", desc: "Başka parça, uzman desteği iste." },
    ],
    steps: [
      { id: "sebep", label: "Değişim nedeni", done: (d) => !!t(d).reason },
      { id: "sokulen", label: "Sökülen parça", done: (d) => !!t(d).removed && d.evidence.some((e) => e.stepId === "sokulen") },
      { id: "takilan", label: "Takılan parça", done: (d) => !!t(d).installed && d.evidence.some((e) => e.stepId === "takilan") },
      { id: "aksiyon", label: "Kurulum işlemleri", done: (d) => !!t(d).installActions },
      { id: "test", label: "Fonksiyon testi", done: (d) => !!t(d).funcTest },
      { id: "imha", label: "Eski parça akıbeti", done: (d) => !!t(d).disposition },
    ],
  },

  diger: {
    requiresVoice: false,
    pathOptions: [
      { k: "fast", icon: FileText, title: "Kayda başla", desc: "Genel kayıt akışı.", dark: true },
      { k: "support", icon: LifeBuoy, title: "Destek gerekli", desc: "Destek talebi oluştur." },
    ],
    steps: [
      { id: "ozet", label: "Özet", done: (d) => !!t(d).summary },
    ],
  },
};

export function progressFor(draft: WorkDraft) {
  const type = (draft.workType ?? "ariza") as WorkType;
  const wf = WORKFLOWS[type];
  const items = wf.steps.map((s) => ({ id: s.id, label: s.label, done: s.done(draft) }));
  const completed = items.filter((i) => i.done).length;
  const firstIncompleteIdx = items.findIndex((i) => !i.done);
  return {
    type,
    items,
    completed,
    total: items.length,
    firstIncompleteStepId: firstIncompleteIdx >= 0 ? items[firstIncompleteIdx].id : null,
  };
}

export function missingForReview(draft: WorkDraft): string[] {
  const { items } = progressFor(draft);
  const missing = items.filter((i) => !i.done).map((i) => i.label);
  const type = (draft.workType ?? "ariza") as WorkType;
  if (WORKFLOWS[type].requiresVoice && !draft.voiceTranscript?.trim()) missing.push("Sesli kapanış");
  // Parça: functional test must not be "kaldi" for completion
  if (type === "parca" && (draft.template as any)?.funcTest === "kaldi") missing.push("Fonksiyon testi geçmedi — tamamlanamaz");
  if (type === "kurulum") {
    const st = (draft.template as any)?.completionStatus;
    if (st === "tam" && !(draft.template as any)?.commTestResult) missing.push("Devreye alma tamamlanmadı");
  }
  if (draft.blocked) missing.push("İş bloklanmış");
  return missing;
}
