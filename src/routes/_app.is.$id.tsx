import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMock } from "@/lib/mock";
import { AppHeader, BottomNav } from "@/components/AppShell";
import { WORK_TYPE_LABEL, STATUS_LABEL, statusPillClass, formatDateTr, SOURCE_LABEL } from "@/lib/toola";
import { toast } from "sonner";
import {
  ArrowLeft, Mic, Sparkles, LifeBuoy, CheckCircle2, ImageIcon, ShieldCheck, Pencil, Wrench, History as HistoryIcon, Plus, Save, Trash2, BookOpen,
} from "lucide-react";
import { AssignedIntake } from "@/components/AssignedIntake";
import { ContinueCard } from "@/components/ContinueCard";
import { AiDiagnostic } from "@/components/AiDiagnostic";
import { SupportFlow } from "@/components/SupportFlow";
import { CompletionTemplate, type WorkType } from "@/components/CompletionTemplates";
import { FinalReview } from "@/components/FinalReview";
import { EvidencePicker, EvidenceGrid, EvidencePreview } from "@/components/EvidencePicker";
import { MachinePicker, LocationPicker } from "@/components/Pickers";
import { VoiceRecorderSheet } from "@/components/QuickFlows";
import { CompletedView } from "@/components/CompletedView";
import { LinkedRecordsList } from "@/components/LinkedRecordsList";
import { MaintenanceFlow } from "@/components/flows/MaintenanceFlow";
import { TestFlow } from "@/components/flows/TestFlow";
import { InstallationFlow } from "@/components/flows/InstallationFlow";
import { PartReplacementFlow } from "@/components/flows/PartReplacementFlow";
import { WORKFLOWS, type WorkType as WfType } from "@/lib/workflows";
import type { DraftEvidence } from "@/lib/mock";

export const Route = createFileRoute("/_app/is/$id")({
  ssr: false,
  component: WorkDetailPage,
});

type Work = {
  id: string; org_id: string; code: string; type: string; status: string; priority: string; source: string;
  title: string; description: string | null;
  initial_state: string | null; work_performed: string | null; final_state: string | null;
  root_cause: string | null; root_cause_status: string | null;
  follow_up_needed: boolean; follow_up_reason: string | null;
  created_at: string; closed_at: string | null;
  machine_id: string | null;
  machine?: { id: string; name: string; location: string | null; model: string | null; serial: string | null } | null;
  assigned_to: string | null; created_by: string | null;
};

type Evidence = { id: string; kind: string; storage_path: string | null; text_value: string | null; created_at: string };
type VoiceClosure = { id: string; audio_path: string | null; transcript: string | null; structured: any; confirmed: boolean };

function WorkDetailPage() {
  const { id } = Route.useParams();
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const { getDraft, updateDraft, clearDraft, discardDraft, startWorkflow, setSync, setPendingCount, setStep } = useMock();
  const draft = getDraft(id);

  const [tab, setTab] = useState<"aktif" | "gecmis">("aktif");
  const [path, setPath] = useState<"none" | "fast" | "ai" | "support" | "procedure">("none");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [machinePicker, setMachinePicker] = useState(false);
  const [locationPicker, setLocationPicker] = useState(false);
  const [mockMachineLabel, setMockMachineLabel] = useState<string | null>(null);
  const [mockLocationLabel, setMockLocationLabel] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const { data: w, isLoading } = useQuery({
    queryKey: ["work", id],
    queryFn: async (): Promise<Work | null> => {
      const { data, error } = await supabase
        .from("work_records")
        .select("*, machine:machines(id, name, location, model, serial)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Work | null;
    },
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: async (): Promise<Evidence[]> => {
      const { data, error } = await supabase
        .from("evidence").select("id, kind, storage_path, text_value, created_at")
        .eq("work_record_id", id).order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Evidence[];
    },
  });

  const { data: closure } = useQuery({
    queryKey: ["closure", id],
    queryFn: async (): Promise<VoiceClosure | null> => {
      const { data, error } = await supabase
        .from("voice_closures").select("id, audio_path, transcript, structured, confirmed")
        .eq("work_record_id", id).maybeSingle();
      if (error) throw error;
      return (data as VoiceClosure | null) ?? null;
    },
  });

  // Ensure workType is set on the draft once we know the work record's type
  useEffect(() => {
    if (w && (!draft || !draft.workType)) {
      startWorkflow(id, w.type as WfType);
    }
  }, [w?.id, w?.type]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["work", id] });
    qc.invalidateQueries({ queryKey: ["evidence", id] });
    qc.invalidateQueries({ queryKey: ["closure", id] });
    qc.invalidateQueries({ queryKey: ["work-records"] });
    qc.invalidateQueries({ queryKey: ["gecmis"] });
  };

  if (isLoading || !w) {
    return (
      <div className="min-h-screen pb-32">
        <AppHeader title="Kayıt" />
        <main className="mx-auto max-w-md px-4 py-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 card-soft animate-pulse" />)}
        </main>
        <BottomNav />
      </div>
    );
  }

  const machineName = w.machine?.name ?? mockMachineLabel ?? "Belirlenmedi";
  const locationName = w.machine?.location ?? mockLocationLabel ?? "Belirlenmedi";

  const type = (w.type as WfType) ?? "ariza";
  const wf = WORKFLOWS[type];
  const isAssigned = w.source === "atanan";
  const needsIntake = isAssigned && !draft?.accepted && w.status !== "tamamlandi";
  const hasProgress = !!draft && (draft.evidence.length > 0 || !!draft.intervention?.trim() || !!draft.voiceTranscript?.trim() || !!draft.template || (draft.measurements?.length ?? 0) > 0 || (draft.completedSteps?.length ?? 0) > 0);

  function continueFromStep(stepId?: string | null) {
    if (stepId) setStep(id, stepId);
    setPath("fast");
  }

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Kayıt detayı" />
      <main className="mx-auto max-w-md px-4 py-4">
        <Link to="/islerim" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> İşlerim
        </Link>

        {/* Header card */}
        <div className="card-soft p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="pill pill-ink">{WORK_TYPE_LABEL[w.type]}</span>
            <span className={statusPillClass(w.status)}>{STATUS_LABEL[w.status]}</span>
            <span className="pill">{w.code}</span>
            {w.priority && w.priority !== "normal" && <span className="pill pill-warning capitalize">{w.priority}</span>}
            {draft?.blocked && <span className="pill pill-danger">Bloklu</span>}
          </div>
          <h1 className="text-xl font-bold tracking-tight">{w.title}</h1>
          {w.description && <p className="text-sm text-muted-foreground mt-1">{w.description}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <KVEditable label="Makine" value={machineName} placeholder="Belirlenmedi" onEdit={() => setMachinePicker(true)} />
            <KVEditable label="Lokasyon" value={locationName} placeholder="Belirlenmedi" onEdit={() => setLocationPicker(true)} />
            <KV label="Kaynak" value={SOURCE_LABEL[w.source]} />
            <KV label="Oluşturulma" value={formatDateTr(w.created_at)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-full mb-4 text-sm font-semibold">
          <button onClick={() => setTab("aktif")} className={`flex-1 h-10 rounded-full ${tab === "aktif" ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}>Aktif İş</button>
          <button onClick={() => setTab("gecmis")} className={`flex-1 h-10 rounded-full ${tab === "gecmis" ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}>Makine Geçmişi</button>
        </div>

        {tab === "gecmis" ? (
          <MachineHistory workId={w.id} machineId={w.machine_id} />
        ) : w.status === "tamamlandi" ? (
          <CompletedView w={w} type={type} technician={profile?.full_name ?? undefined} assignedBy={isAssigned ? "Vardiya Amiri • Selim K." : undefined} />
        ) : (
          <>
            {needsIntake && (
              <div className="mb-4">
                <AssignedIntake
                  workTitle={w.title}
                  onAccept={() => { startWorkflow(w.id, type); setPath("none"); toast.success("İş kabul edildi, başlattın"); }}
                  onSupport={() => { startWorkflow(w.id, type); setPath("support"); }}
                />
              </div>
            )}

            {!needsIntake && hasProgress && path === "none" && draft && (
              <div className="mb-4">
                <ContinueCard draft={draft} onContinue={continueFromStep} />
              </div>
            )}

            {!needsIntake && !!draft?.support && !draft.support.resolved && path === "none" && (
              <div className="mb-4">
                <button onClick={() => setPath("support")} className="card-soft w-full p-4 text-left">
                  <div className="flex items-center gap-2 mb-1"><LifeBuoy className="h-4 w-4 text-warning" /><div className="font-semibold">Bekleme durumunda</div></div>
                  <div className="text-sm text-muted-foreground">Destek/parça bekleniyor. Tıklayarak güncel duruma git.</div>
                </button>
              </div>
            )}

            {!needsIntake && path === "none" && (
              <>
                <PathPicker type={type} onPick={setPath} />
                <LinkedRecordsList workId={w.id} />
                {hasProgress && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button className="btn btn-ghost" onClick={() => { toast.success("Taslak kaydedildi"); setSync("syncing"); setPendingCount(1); }}>
                      <Save className="h-4 w-4" /> Taslağı kaydet ve çık
                    </button>
                    <button className="btn btn-ghost text-destructive" onClick={() => setDiscardConfirm(true)}>
                      <Trash2 className="h-4 w-4" /> Değişiklikleri sil
                    </button>
                  </div>
                )}
              </>
            )}

            {!needsIntake && path === "fast" && (
              type === "ariza" ? (
                <FastPath
                  w={w}
                  onChange={() => { refresh(); setSync("syncing"); setPendingCount(1); }}
                  onReview={() => setReviewOpen(true)}
                />
              ) : type === "bakim" ? (
                <MaintenanceFlow workId={w.id} workTitle={w.title} workCode={w.code} onReview={() => setReviewOpen(true)} />
              ) : type === "test" ? (
                <TestFlow workId={w.id} workTitle={w.title} workCode={w.code} onReview={() => setReviewOpen(true)} />
              ) : type === "kurulum" ? (
                <InstallationFlow workId={w.id} workTitle={w.title} workCode={w.code} onReview={() => setReviewOpen(true)} />
              ) : type === "parca" ? (
                <PartReplacementFlow workId={w.id} workTitle={w.title} workCode={w.code} onReview={() => setReviewOpen(true)} />
              ) : (
                <FastPath w={w} onChange={() => { refresh(); }} onReview={() => setReviewOpen(true)} />
              )
            )}

            {!needsIntake && path === "ai" && (
              <AiDiagnostic workId={w.id} symptom={w.description ?? undefined} onBack={() => setPath("none")} onProceed={() => setPath("fast")} />
            )}

            {!needsIntake && path === "support" && (
              <SupportFlow workId={w.id} onBack={() => setPath("none")} />
            )}

            {!needsIntake && path === "procedure" && (
              <ProcedureView type={type} onBack={() => setPath("none")} />
            )}
          </>
        )}

        {reviewOpen && (
          <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <AppHeader title="Son kontrol" back={() => setReviewOpen(false)} />
            <main className="mx-auto max-w-md px-4 py-4">
              <FinalReview
                workId={w.id} type={type}
                machine={machineName} location={locationName}
                onClose={() => setReviewOpen(false)}
                onConfirm={async () => {
                  const tpl = (draft?.template ?? {}) as Record<string, any>;
                  await supabase.from("work_records").update({
                    status: "tamamlandi",
                    closed_at: new Date().toISOString(),
                    work_performed: (draft?.intervention || tpl.intervention || tpl.actions || tpl.installActions || tpl.commissioning || w.work_performed) ?? null,
                    initial_state: tpl.initial ?? tpl.initialMeasurements ?? tpl.siteCheck ?? w.initial_state,
                    final_state: tpl.result ?? tpl.finalMeasurements ?? tpl.commTestResult ?? tpl.verdict ?? w.final_state,
                    root_cause: tpl.rootCause ?? draft?.identifiedCause ?? w.root_cause,
                    root_cause_status: tpl.rootCauseStatus ?? w.root_cause_status,
                    follow_up_needed: !!tpl.followUp || (draft?.findings ?? []).some((f: any) => f.action !== "gozlem"),
                    follow_up_reason: tpl.followUp ?? null,
                  }).eq("id", w.id);
                  toast.success("Kayıt kanıtlı kapatıldı");
                  // Keep draft so CompletedView can render rich structured data
                  setReviewOpen(false);
                  refresh();
                }}
              />
            </main>
          </div>
        )}

        {machinePicker && (
          <MachinePicker
            onClose={() => setMachinePicker(false)}
            onPick={(m) => { setMockMachineLabel(m.name); setMockLocationLabel(m.location); setMachinePicker(false); toast.success(`${m.name} bağlandı (demo)`); }}
          />
        )}
        {locationPicker && (
          <LocationPicker onClose={() => setLocationPicker(false)} onPick={(l) => { setMockLocationLabel(l.label); setLocationPicker(false); }} />
        )}
        {discardConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setDiscardConfirm(false)}>
            <div className="card-soft p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="font-semibold mb-1">Tüm taslak değişiklikleri silinsin mi?</div>
              <div className="text-sm text-muted-foreground mb-4">Bu işlem geri alınamaz. Yerel taslak silinecek.</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setDiscardConfirm(false)}>Vazgeç</button>
                <button className="btn btn-danger" onClick={() => { discardDraft(w.id); setDiscardConfirm(false); toast.success("Taslak silindi"); setPath("none"); }}>Sil</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return <div><div className="label">{label}</div><div className="font-medium truncate">{value}</div></div>;
}
function KVEditable({ label, value, placeholder, onEdit }: { label: string; value: string; placeholder: string; onEdit: () => void }) {
  const empty = value === placeholder;
  return (
    <div>
      <div className="label">{label}</div>
      <button onClick={onEdit} className={`font-medium truncate flex items-center gap-1 ${empty ? "text-primary" : ""}`}>
        <span className="truncate">{value}</span>
        <Pencil className="h-3 w-3 shrink-0" />
      </button>
    </div>
  );
}

function PathPicker({ type, onPick }: { type: WfType; onPick: (p: "fast" | "ai" | "support" | "procedure") => void }) {
  const wf = WORKFLOWS[type];
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Nasıl ilerlemek istiyorsun?</div>
      {wf.pathOptions.map((it) => {
        const Icon = it.icon;
        return (
          <button key={it.k} onClick={() => onPick(it.k)} className="card-soft w-full p-4 text-left active:scale-[0.99] tap" style={it.dark ? { background: "var(--color-ink)", color: "var(--color-ink-foreground)", borderColor: "transparent" } : undefined}>
            <Icon className="h-6 w-6 mb-2" />
            <div className="font-semibold text-[15px]">{it.title}</div>
            <div className="text-[13px] opacity-80 mt-0.5">{it.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function ProcedureView({ type, onBack }: { type: WfType; onBack: () => void }) {
  const titleByType: Record<string, string> = {
    bakim: "Bakım prosedürü", test: "Test prosedürü", kurulum: "Kurulum talimatı", parca: "Parça değişim prosedürü", ariza: "Arıza giderme rehberi", diger: "Prosedür",
  };
  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="flex items-center gap-2 mb-2"><BookOpen className="h-5 w-5" /><div className="font-semibold">{titleByType[type]}</div></div>
        <div className="text-sm text-muted-foreground mb-3">Bu, prosedür/talimat görüntüleyicisinin prototip önizlemesidir. Gerçek belge entegrasyonu açıldığında ilgili sayfa burada görünecektir.</div>
        <div className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed">
          <p className="mb-2"><strong>1. Hazırlık:</strong> Etiketle-kilitle uygula, kişisel koruyucu donanımları kontrol et.</p>
          <p className="mb-2"><strong>2. Kontrol noktaları:</strong> İlgili kontrol kalemlerini sırayla uygula.</p>
          <p className="mb-2"><strong>3. Ölçüm:</strong> Referans değerlerle karşılaştır.</p>
          <p><strong>4. Onay:</strong> Sonuçları belgele ve kapanışa geç.</p>
        </div>
      </div>
      <button className="btn btn-primary w-full" onClick={onBack}>Geri dön ve adımlara başla</button>
    </div>
  );
}

/* -------- Fast path (voice-first, fault) -------- */

function FastPath({ w, onChange, onReview }: {
  w: Work; onChange: () => void; onReview: () => void;
}) {
  const { getDraft, updateDraft, setDirty } = useMock();
  const draft = getDraft(w.id) ?? { workId: w.id, step: 0, evidence: [], lastSavedAt: Date.now() };

  const [picker, setPicker] = useState<null | "once" | "sonra">(null);
  const [preview, setPreview] = useState<DraftEvidence | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const beforeMock = draft.evidence.filter((e) => e.side === "once");
  const afterMock = draft.evidence.filter((e) => e.side === "sonra");

  function addEvidence(ev: DraftEvidence) {
    updateDraft(w.id, { evidence: [...draft.evidence, ev] });
    setDirty(true);
  }
  function removeEvidence(eid: string) {
    updateDraft(w.id, { evidence: draft.evidence.filter((e) => e.id !== eid) });
  }

  function onTranscript(t: string) {
    updateDraft(w.id, {
      voiceTranscript: t,
      template: {
        ...(draft.template ?? {}),
        symptom: (draft.template?.symptom) ?? "Yüksek titreşim ve ses",
        initial: (draft.template?.initial) ?? "Konveyör çalışıyor, anormal ses var",
        intervention: (draft.template?.intervention) ?? t,
        rootCause: (draft.template?.rootCause) ?? "Kaplin hizasızlığı",
        rootCauseStatus: (draft.template?.rootCauseStatus) ?? "tahmini",
        result: (draft.template?.result) ?? "Titreşim normale döndü",
      },
    });
    setDirty(true);
    toast.success("ToolA, anlatımından bir taslak özet oluşturdu — kontrol et ve kapat.");
  }

  return (
    <div className="space-y-4">
      <StepSection step={1} title="İlk durum kanıtı" subtitle="Fotoğraf, ölçüm veya kısa not ekle">
        <EvidenceGrid items={beforeMock} onRemove={removeEvidence} onPreview={setPreview} />
        <button onClick={() => setPicker("once")} className="btn btn-ghost w-full mt-3"><Plus className="h-4 w-4" /> Kanıt ekle</button>
      </StepSection>

      <StepSection step={2} title="Yapılan işi bir kez sesli anlat" subtitle="Aynı bilgiyi tekrar yazmak yok — ToolA özetini sen düzenlersin">
        <button onClick={() => setVoiceOpen(true)} className="btn btn-ink w-full">
          <Mic className="h-5 w-5" /> {draft.voiceTranscript ? "Tekrar kaydet" : "Sesli anlat"}
        </button>
        {draft.voiceTranscript && (
          <div className="mt-3 rounded-2xl border border-border p-3 text-sm">
            <div className="label mb-1">Anlatımın</div>
            <div className="whitespace-pre-wrap">{draft.voiceTranscript}</div>
          </div>
        )}
      </StepSection>

      <StepSection step={3} title="Sonuç kanıtı" subtitle="Çalışır durumun fotoğrafı/ölçümü">
        <EvidenceGrid items={afterMock} onRemove={removeEvidence} onPreview={setPreview} />
        <button onClick={() => setPicker("sonra")} className="btn btn-ghost w-full mt-3"><Plus className="h-4 w-4" /> Kanıt ekle</button>
      </StepSection>

      <StepSection step={4} title="ToolA özeti — düzenle" subtitle="Anlatımından oluşturuldu. İhtiyaca göre değiştir.">
        <CompletionTemplate workId={w.id} type={w.type as WorkType} />
      </StepSection>

      <button onClick={onReview} className="btn btn-primary w-full">
        <ShieldCheck className="h-4 w-4" /> Kontrol et ve kanıtlı kapat
      </button>

      {picker && <EvidencePicker onAdd={(e) => addEvidence({ ...e, side: picker })} onClose={() => setPicker(null)} />}
      {preview && <EvidencePreview e={preview} onClose={() => setPreview(null)} />}
      {voiceOpen && (
        <VoiceRecorderSheet
          hint='"Ne gördün, ne yaptın ve sonuç ne oldu? Sesli anlat."'
          onClose={() => setVoiceOpen(false)}
          onDone={({ transcript }) => { onTranscript(transcript); setVoiceOpen(false); }}
        />
      )}
    </div>
  );
}

function StepSection({ step, title, subtitle, children }: { step: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card-soft p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-7 w-7 rounded-full bg-ink text-ink-foreground grid place-items-center text-xs font-bold shrink-0">{step}</div>
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{title}</div>
          {subtitle && <div className="text-[12px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

/* -------- Machine history -------- */

function MachineHistory({ workId, machineId }: { workId: string; machineId: string | null }) {
  const { data = [] } = useQuery({
    queryKey: ["machine-history", machineId, workId],
    enabled: !!machineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_records")
        .select("id, code, type, status, title, created_at, closed_at, final_state")
        .eq("machine_id", machineId!).neq("id", workId)
        .order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-3">
      <div className="card-soft p-4 border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary" /><div className="text-[12px] uppercase tracking-wider opacity-70">ToolA karar desteği</div></div>
        <div className="text-sm">Son 90 günde 3 yüksek titreşim kaydı oluştu. İki kayıtta kaplin hizasızlığı tespit edildi.</div>
      </div>

      {!machineId && (
        <div className="card-soft p-5 text-sm text-muted-foreground flex items-center justify-between gap-2">
          <span>Bu kayda henüz makine bağlanmadı.</span>
          <button className="btn btn-ghost text-xs h-9"><Wrench className="h-4 w-4" /> Makine seç</button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card-soft p-5 text-center">
          <HistoryIcon className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          <div className="font-semibold">Bu makine için geçmiş kayıt yok</div>
        </div>
      ) : data.map((r: any) => (
        <Link to="/is/$id" params={{ id: r.id }} key={r.id} className="card-soft block p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="pill pill-ink">{WORK_TYPE_LABEL[r.type]}</span>
            <span className={statusPillClass(r.status)}>{STATUS_LABEL[r.status]}</span>
            <span className="pill">{r.code}</span>
          </div>
          <div className="font-medium text-sm">{r.title}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">{formatDateTr(r.created_at)}</div>
        </Link>
      ))}
    </div>
  );
}
