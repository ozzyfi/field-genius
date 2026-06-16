import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppHeader, BottomNav } from "@/components/AppShell";
import { WORK_TYPE_LABEL, STATUS_LABEL, statusPillClass, formatDateTr, SOURCE_LABEL } from "@/lib/toola";
import { toast } from "sonner";
import {
  ArrowLeft, Camera, Mic, Square, Play, Sparkles, LifeBuoy, CheckCircle2, ImageIcon, X, Pause, Trash2, FileAudio2, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_app/is/$id")({
  ssr: false,
  component: WorkDetailPage,
});

type Work = {
  id: string;
  org_id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  title: string;
  description: string | null;
  initial_state: string | null;
  work_performed: string | null;
  final_state: string | null;
  root_cause: string | null;
  root_cause_status: string | null;
  follow_up_needed: boolean;
  follow_up_reason: string | null;
  created_at: string;
  closed_at: string | null;
  machine_id: string | null;
  machine?: { id: string; name: string; location: string | null; model: string | null; serial: string | null } | null;
  assigned_to: string | null;
  created_by: string | null;
};

type Evidence = {
  id: string;
  kind: string;
  storage_path: string | null;
  text_value: string | null;
  created_at: string;
};

type VoiceClosure = {
  id: string;
  audio_path: string | null;
  transcript: string | null;
  structured: any;
  confirmed: boolean;
};

function WorkDetailPage() {
  const { id } = Route.useParams();
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"aktif" | "gecmis">("aktif");
  const [path, setPath] = useState<"none" | "fast" | "ai" | "support">("none");

  const { data: w, isLoading } = useQuery({
    queryKey: ["work", id],
    queryFn: async (): Promise<Work | null> => {
      const { data, error } = await supabase
        .from("work_records")
        .select("*, machine:machines(id, name, location, model, serial)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Work | null;
    },
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: async (): Promise<Evidence[]> => {
      const { data, error } = await supabase
        .from("evidence")
        .select("id, kind, storage_path, text_value, created_at")
        .eq("work_record_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Evidence[];
    },
  });

  const { data: closure } = useQuery({
    queryKey: ["closure", id],
    queryFn: async (): Promise<VoiceClosure | null> => {
      const { data, error } = await supabase
        .from("voice_closures")
        .select("id, audio_path, transcript, structured, confirmed")
        .eq("work_record_id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as VoiceClosure | null) ?? null;
    },
  });

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
        <main className="mx-auto max-w-md px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</main>
        <BottomNav />
      </div>
    );
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
          </div>
          <h1 className="text-xl font-bold tracking-tight">{w.title}</h1>
          {w.description && <p className="text-sm text-muted-foreground mt-1">{w.description}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <KV label="Makine" value={w.machine?.name ?? "Belirlenmedi"} />
            <KV label="Lokasyon" value={w.machine?.location ?? "—"} />
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
          <CompletedView w={w} evidence={evidence} closure={closure ?? null} />
        ) : (
          <>
            {path === "none" && <PathPicker onPick={setPath} />}
            {path === "fast" && (
              <FastPath w={w} evidence={evidence} closure={closure ?? null} userId={user?.id} orgId={profile?.org_id} onChange={refresh} />
            )}
            {path === "ai" && <AiPathStub onBack={() => setPath("none")} />}
            {path === "support" && <SupportPath w={w} onBack={() => setPath("none")} onChange={refresh} />}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

function PathPicker({ onPick }: { onPick: (p: "fast" | "ai" | "support") => void }) {
  const items = [
    { k: "fast" as const, icon: CheckCircle2, title: "Sorunu biliyorum", desc: "Hızlı kapanış: ilk kanıt → müdahale → son kanıt → ses ile kapat.", tone: "bg-ink text-ink-foreground" },
    { k: "ai" as const, icon: Sparkles, title: "ToolA ile teşhis et", desc: "Makine geçmişi, benzer vakalar ve kontrol adımlarıyla ilerle.", tone: "bg-surface" },
    { k: "support" as const, icon: LifeBuoy, title: "Destek / parça gerekli", desc: "İşi durdur, parça bekle, uzmanı çağır ya da devret.", tone: "bg-surface" },
  ];
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Nasıl ilerlemek istiyorsun?</div>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button key={it.k} onClick={() => onPick(it.k)} className={`card-soft w-full p-4 text-left active:scale-[0.99] tap ${it.tone === "bg-ink text-ink-foreground" ? "border-transparent" : ""}`} style={it.tone === "bg-ink text-ink-foreground" ? { background: "var(--color-ink)", color: "var(--color-ink-foreground)" } : undefined}>
            <Icon className="h-6 w-6 mb-2" />
            <div className="font-semibold text-[15px]">{it.title}</div>
            <div className="text-[13px] opacity-80 mt-0.5">{it.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function AiPathStub({ onBack }: { onBack: () => void }) {
  return (
    <div className="card-soft p-5">
      <div className="font-semibold mb-1">ToolA Teşhis</div>
      <p className="text-sm text-muted-foreground mb-4">
        Bu yolda makine geçmişi, benzer vakalar ve kontrol adımları sunulur. Model entegrasyonu hazır;
        gerçek LLM bağlantısı bu projede demo modunda kalmıştır.
      </p>
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground mb-4">
        Güvenilir kaynaklı öneri üretilemedi.
      </div>
      <button className="btn btn-ghost w-full" onClick={onBack}>Geri</button>
    </div>
  );
}

function SupportPath({ w, onBack, onChange }: { w: Work; onBack: () => void; onChange: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function pause(status: "kapanis_eksik") {
    setBusy(true);
    const { error } = await supabase
      .from("work_records")
      .update({ status, follow_up_needed: true, follow_up_reason: reason || "Bekleme" })
      .eq("id", w.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Kayıt bekletildi");
    onChange();
    onBack();
  }
  return (
    <div className="card-soft p-5">
      <div className="font-semibold mb-1">Destek veya parça bekleniyor</div>
      <p className="text-sm text-muted-foreground mb-3">Neden iş şu anda tamamlanamıyor?</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {["Parça bekleniyor", "Uzman desteği", "Başka ekip", "Erişim yok", "Arıza tekrar üretilemedi", "Vardiya devri"].map((r) => (
          <button key={r} onClick={() => setReason(r)} className={`pill ${reason === r ? "pill-ink" : ""}`}>{r}</button>
        ))}
      </div>
      <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Detay (opsiyonel)" />
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="btn btn-ghost" onClick={onBack}>Vazgeç</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => pause("kapanis_eksik")}>Beklet</button>
      </div>
    </div>
  );
}

/* ---------- FAST PATH ---------- */

function FastPath({
  w, evidence, closure, userId, orgId, onChange,
}: {
  w: Work; evidence: Evidence[]; closure: VoiceClosure | null;
  userId?: string; orgId?: string; onChange: () => void;
}) {
  const beforeKinds = new Set(["foto_oncesi", "video_oncesi", "ses", "olcum_oncesi", "hata_kodu"]);
  const afterKinds = new Set(["foto_sonrasi", "video_sonrasi", "olcum_sonrasi"]);
  const before = evidence.filter((e) => beforeKinds.has(e.kind));
  const after = evidence.filter((e) => afterKinds.has(e.kind));

  return (
    <div className="space-y-4">
      <StepSection step={1} title="İlk durum kanıtı" subtitle="Fotoğraf, ölçüm veya kısa not ekle">
        <EvidenceBlock workId={w.id} orgId={orgId} userId={userId} items={before} side="before" onChange={onChange} />
      </StepSection>

      <StepSection step={2} title="Yapılan müdahale" subtitle="Ne buldun, ne yaptın?">
        <InterventionEditor w={w} onChange={onChange} />
      </StepSection>

      <StepSection step={3} title="Sonuç kanıtı" subtitle="Çalışır durumun fotoğrafı/ölçümü">
        <EvidenceBlock workId={w.id} orgId={orgId} userId={userId} items={after} side="after" onChange={onChange} />
      </StepSection>

      <StepSection step={4} title="Sesli kapanış" subtitle='"Ne gördün, ne yaptın ve sonuç ne oldu? Sesli anlat."'>
        <VoiceClosureBlock w={w} closure={closure} orgId={orgId} userId={userId} onChange={onChange} />
      </StepSection>

      <CloseCard w={w} closure={closure} before={before} after={after} onChange={onChange} />
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

/* Evidence */

function EvidenceBlock({
  workId, orgId, userId, items, side, onChange,
}: {
  workId: string; orgId?: string; userId?: string; items: Evidence[]; side: "before" | "after"; onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function addPhoto(file: File) {
    if (!orgId) return;
    setBusy(true);
    const path = `${orgId}/${workId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("evidence").upload(path, file, { upsert: false });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("evidence").insert({
      org_id: orgId, work_record_id: workId, kind: side === "before" ? "foto_oncesi" : "foto_sonrasi",
      storage_path: path, created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Fotoğraf yüklendi");
    onChange();
  }

  async function addNote(kind: string) {
    if (!orgId || !note.trim()) return;
    const { error } = await supabase.from("evidence").insert({
      org_id: orgId, work_record_id: workId, kind: kind as any, text_value: note.trim(), created_by: userId,
    });
    if (error) return toast.error(error.message);
    setNote("");
    toast.success("Eklendi");
    onChange();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {items.filter((e) => e.storage_path).map((e) => <EvidenceThumb key={e.id} path={e.storage_path!} onRemove={async () => {
          await supabase.from("evidence").delete().eq("id", e.id);
          if (e.storage_path) await supabase.storage.from("evidence").remove([e.storage_path]);
          onChange();
        }} />)}
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-muted-foreground tap">
          <Camera className="h-6 w-6" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && addPhoto(e.target.files[0])} />
      </div>

      {items.filter((e) => e.text_value).map((e) => (
        <div key={e.id} className="text-[13px] border-l-2 border-border pl-3 py-1 mb-1 flex items-start justify-between gap-2">
          <div>
            <span className="text-muted-foreground mr-2">{kindLabel(e.kind)}:</span>
            {e.text_value}
          </div>
          <button onClick={async () => { await supabase.from("evidence").delete().eq("id", e.id); onChange(); }} className="text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      ))}

      <div className="mt-2 flex gap-2">
        <input className="input flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder={side === "before" ? "Ölçüm / hata kodu / not" : "Son ölçüm / test sonucu"} />
        <button onClick={() => addNote(side === "before" ? "olcum_oncesi" : "olcum_sonrasi")} className="btn btn-ghost" disabled={!note.trim()}>Ekle</button>
      </div>
    </div>
  );
}

function kindLabel(k: string) {
  switch (k) {
    case "foto_oncesi": return "İlk fotoğraf";
    case "foto_sonrasi": return "Son fotoğraf";
    case "olcum_oncesi": return "İlk ölçüm";
    case "olcum_sonrasi": return "Son ölçüm";
    case "ses": return "Ses";
    case "hata_kodu": return "Hata kodu";
    default: return k;
  }
}

function EvidenceThumb({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.storage.from("evidence").createSignedUrl(path, 3600).then(({ data }) => {
      if (alive) setUrl(data?.signedUrl ?? null);
    });
    return () => { alive = false; };
  }, [path]);
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-2">
      {url ? <img src={url} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
      <button onClick={onRemove} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-ink text-ink-foreground grid place-items-center"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* Intervention */

function InterventionEditor({ w, onChange }: { w: Work; onChange: () => void }) {
  const [text, setText] = useState(w.work_performed ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (text === (w.work_performed ?? "")) return;
      setSaving(true);
      const { error } = await supabase.from("work_records").update({ work_performed: text || null }).eq("id", w.id);
      setSaving(false);
      if (!error) { setSavedAt(Date.now()); onChange(); }
    }, 700);
    return () => clearTimeout(t);
  }, [text]);

  const quick = ["Onarım", "Ayar", "Kalibrasyon", "Temizlik", "Reset", "Parça değişimi"];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {quick.map((q) => (
          <button key={q} onClick={() => setText((t) => (t ? `${t}\n• ${q}` : `• ${q}`))} className="pill">{q}</button>
        ))}
      </div>
      <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bulgu, yapılan iş, kullanılan parça, süre…" rows={5} />
      <div className="text-[11px] text-muted-foreground mt-1 h-4">{saving ? "Kaydediliyor…" : savedAt ? "Cihaza kaydedildi • Senkronize" : ""}</div>
    </div>
  );
}

/* Voice closure */

function VoiceClosureBlock({
  w, closure, orgId, userId, onChange,
}: { w: Work; closure: VoiceClosure | null; orgId?: string; userId?: string; onChange: () => void }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(closure?.transcript ?? "");
  const [structured, setStructured] = useState<any>(closure?.structured ?? { ariza: "", ilk_durum: "", yapilan: "", parca: "", sonuc: "", takip: "" });
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [savedClosureUrl, setSavedClosureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (closure?.audio_path) {
      supabase.storage.from("evidence").createSignedUrl(closure.audio_path, 3600).then(({ data }) => setSavedClosureUrl(data?.signedUrl ?? null));
    }
    if (closure?.transcript) setTranscript(closure.transcript);
    if (closure?.structured) setStructured(closure.structured);
  }, [closure?.id]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch (e: any) {
      toast.error("Mikrofona erişilemedi: " + e.message);
    }
  }
  function stop() { recRef.current?.stop(); setRecording(false); }
  function discard() { setAudioBlob(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); }

  async function save() {
    if (!orgId) return;
    let audioPath = closure?.audio_path ?? null;
    if (audioBlob) {
      const fname = `${orgId}/${w.id}/closure-${Date.now()}.webm`;
      const { error } = await supabase.storage.from("evidence").upload(fname, audioBlob, { upsert: true, contentType: audioBlob.type });
      if (error) return toast.error(error.message);
      audioPath = fname;
    }
    if (closure) {
      const { error } = await supabase.from("voice_closures").update({
        audio_path: audioPath, transcript, structured,
      }).eq("id", closure.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("voice_closures").insert({
        org_id: orgId, work_record_id: w.id, audio_path: audioPath, transcript, structured, created_by: userId,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Sesli kapanış kaydedildi");
    setAudioBlob(null);
    onChange();
  }

  const fields: Array<[keyof typeof structured | string, string]> = [
    ["ariza", "Arıza / belirti"],
    ["ilk_durum", "İlk durum"],
    ["yapilan", "Yapılan müdahale"],
    ["parca", "Kullanılan parça"],
    ["sonuc", "Sonuç"],
    ["takip", "Takip ihtiyacı"],
  ];

  return (
    <div>
      <div className="rounded-2xl bg-surface-2 p-4 flex items-center gap-3 mb-3">
        {!recording && !audioBlob && !savedClosureUrl && (
          <button onClick={start} className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 tap">
            <Mic className="h-6 w-6" />
          </button>
        )}
        {recording && (
          <button onClick={stop} className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground grid place-items-center animate-pulse tap">
            <Square className="h-6 w-6" />
          </button>
        )}
        {!recording && (audioBlob || savedClosureUrl) && (
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const a = new Audio(audioUrl ?? savedClosureUrl!);
              a.play();
            }} className="h-12 w-12 rounded-full bg-ink text-ink-foreground grid place-items-center"><Play className="h-5 w-5" /></button>
            {audioBlob && <button onClick={discard} className="h-12 w-12 rounded-full bg-surface border border-border grid place-items-center"><Trash2 className="h-5 w-5" /></button>}
            <button onClick={start} className="h-12 w-12 rounded-full bg-surface border border-border grid place-items-center"><Mic className="h-5 w-5" /></button>
          </div>
        )}
        <div className="text-sm">
          <div className="font-semibold">{recording ? "Kaydediliyor…" : audioBlob ? "Kayıt hazır" : savedClosureUrl ? "Sesli kapanış kayıtlı" : "Mikrofona dokun"}</div>
          <div className="text-muted-foreground text-[12px] flex items-center gap-1"><FileAudio2 className="h-3.5 w-3.5" />Yerel cihazda saklanır, sonra senkronize edilir.</div>
        </div>
      </div>

      <label className="label block mb-1">Yazılı dökümün (düzenleyebilirsin)</label>
      <textarea className="input mb-3" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Sesle anlattığını buraya yazıp düzenleyebilirsin. (Otomatik transkripsiyon bu projede demo modundadır.)" rows={4} />

      <div className="space-y-2">
        {fields.map(([k, label]) => (
          <div key={String(k)}>
            <label className="label block mb-1">{label}</label>
            <input className="input" value={structured[k] ?? ""} onChange={(e) => setStructured({ ...structured, [k]: e.target.value })} />
          </div>
        ))}
      </div>

      <button onClick={save} className="btn btn-ink w-full mt-3">Sesli kapanışı kaydet</button>
    </div>
  );
}

/* Final close card */

function CloseCard({ w, closure, before, after, onChange }: { w: Work; closure: VoiceClosure | null; before: Evidence[]; after: Evidence[]; onChange: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const ready =
    !!w.work_performed && w.work_performed.trim().length > 0 &&
    before.length > 0 && after.length > 0 &&
    !!closure && (!!closure.transcript || !!closure.audio_path);

  async function closeNow() {
    if (closure) await supabase.from("voice_closures").update({ confirmed: true, confirmed_at: new Date().toISOString() }).eq("id", closure.id);
    const { error } = await supabase.from("work_records").update({
      status: "tamamlandi",
      closed_at: new Date().toISOString(),
      final_state: closure?.structured?.sonuc ?? null,
      initial_state: closure?.structured?.ilk_durum ?? null,
    }).eq("id", w.id);
    if (error) return toast.error(error.message);
    toast.success("Kayıt kanıtlı kapatıldı");
    onChange();
  }

  return (
    <section className="card-soft p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-success" />
        <div className="font-semibold">Kanıtlı kapat</div>
      </div>
      <ul className="text-[13px] text-muted-foreground space-y-1 mb-3">
        <Check label="İlk durum kanıtı" done={before.length > 0} />
        <Check label="Yapılan iş açıklaması" done={!!w.work_performed && w.work_performed.trim().length > 0} />
        <Check label="Son durum kanıtı" done={after.length > 0} />
        <Check label="Sesli kapanış / döküm" done={!!closure && (!!closure.transcript || !!closure.audio_path)} />
      </ul>
      <label className="flex items-start gap-2 text-sm mb-3">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
        <span>Yukarıdaki bilgileri kontrol ettim, kayıt eksiksiz.</span>
      </label>
      <button disabled={!ready || !confirmed} onClick={closeNow} className="btn btn-primary w-full disabled:opacity-50">
        Kanıtlı kapat
      </button>
    </section>
  );
}

function Check({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-full grid place-items-center text-[10px] ${done ? "bg-success text-success-foreground" : "bg-surface-2 border border-border text-muted-foreground"}`}>{done ? "✓" : ""}</span>
      <span className={done ? "text-foreground" : ""}>{label}</span>
    </li>
  );
}

/* Completed view */

function CompletedView({ w, evidence, closure }: { w: Work; evidence: Evidence[]; closure: VoiceClosure | null }) {
  return (
    <div className="space-y-4">
      <div className="card-soft p-4">
        <div className="text-sm text-muted-foreground">Tamamlandı</div>
        <div className="font-semibold">{formatDateTr(w.closed_at)}</div>
      </div>
      <Block title="İlk durum" body={closure?.structured?.ilk_durum || w.initial_state || "—"} />
      <Block title="Yapılan iş" body={w.work_performed || "—"} />
      <Block title="Sonuç" body={closure?.structured?.sonuc || w.final_state || "—"} />
      <Block title="Sesli kapanış dökümü" body={closure?.transcript || "Döküm yok"} />
      <Block title="Kanıt" body={`${evidence.length} öğe`} />
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-soft p-4">
      <div className="label mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap">{body}</div>
    </div>
  );
}

/* Machine history (basic) */

function MachineHistory({ workId, machineId }: { workId: string; machineId: string | null }) {
  const { data = [] } = useQuery({
    queryKey: ["machine-history", machineId, workId],
    enabled: !!machineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_records")
        .select("id, code, type, status, title, created_at, closed_at, final_state")
        .eq("machine_id", machineId!)
        .neq("id", workId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  if (!machineId) {
    return <div className="card-soft p-5 text-sm text-muted-foreground">Bu kayda henüz makine bağlanmadı. Makine eklendiğinde geçmiş burada görünür.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary" /><div className="text-[12px] uppercase tracking-wider opacity-70">ToolA özeti</div></div>
        <div className="text-sm">
          {data.length === 0
            ? "Bu makinede başka onaylı kayıt bulunmuyor."
            : `Bu makinede son dönemde ${data.length} kayıt mevcut. En son müdahale: ${formatDateTr(data[0].created_at)}.`}
        </div>
      </div>
      {data.map((r: any) => (
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
