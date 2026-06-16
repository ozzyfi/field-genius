import { useEffect, useRef, useState } from "react";
import { FocusSheet } from "./FocusSheet";
import { Mic, Pause, Play, Square, Trash2, Camera, FlashlightIcon, KeyRound, AlertTriangle, RefreshCw, Plus, ScanLine, Sparkles } from "lucide-react";
import { MOCK_MACHINES, QUICK_RECORDING_PHRASES } from "@/lib/mockData";

/* ---------------- Voice recorder ---------------- */

export function VoiceRecorderSheet({ onClose, onDone, hint }: { onClose: () => void; onDone: (data: { transcript: string; durationSec: number }) => void; hint?: string }) {
  const [phase, setPhase] = useState<"idle" | "recording" | "paused" | "done" | "denied">("idle");
  const [sec, setSec] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => { if (tickRef.current) window.clearInterval(tickRef.current); }, []);

  function start() {
    // Prototype: do not request real mic to avoid permission prompts in demo; show simulated UI.
    setPhase("recording");
    setSec(0);
    tickRef.current = window.setInterval(() => setSec((s) => s + 1), 1000);
  }
  function pause() { setPhase("paused"); if (tickRef.current) window.clearInterval(tickRef.current); }
  function resume() { setPhase("recording"); tickRef.current = window.setInterval(() => setSec((s) => s + 1), 1000); }
  function stop() { setPhase("done"); if (tickRef.current) window.clearInterval(tickRef.current); }
  function discard() { setPhase("idle"); setSec(0); }

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  // Fake waveform bars
  const bars = Array.from({ length: 32 }).map((_, i) => {
    const base = phase === "recording" ? Math.abs(Math.sin((Date.now() / 200) + i)) : 0.2;
    return Math.max(0.15, Math.min(1, base + (i % 5) / 10));
  });

  function finish() {
    const transcript = QUICK_RECORDING_PHRASES.slice(0, 1 + (sec % 4)).join(" ");
    onDone({ transcript, durationSec: sec });
  }

  return (
    <FocusSheet
      title="Sesle kayıt"
      onClose={onClose}
      footer={
        phase === "done" ? (
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={discard}>Sil ve tekrar kaydet</button>
            <button className="btn btn-primary" onClick={finish}>Devam et</button>
          </div>
        ) : null
      }
    >
      {hint && <div className="card-soft p-3 text-sm text-muted-foreground mb-4">{hint}</div>}

      {phase === "denied" ? (
        <div className="card-soft p-5 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
          <div className="font-semibold mb-1">Mikrofon izni reddedildi</div>
          <p className="text-sm text-muted-foreground mb-3">Tarayıcı/Sistem ayarlarından ToolA için mikrofon erişimine izin vermelisin.</p>
          <button className="btn btn-ghost w-full" onClick={() => setPhase("idle")}>Tekrar dene</button>
        </div>
      ) : (
        <>
          <div className="card-soft p-6 text-center mb-4">
            <div className="text-[12px] uppercase tracking-widest text-muted-foreground mb-1">Süre</div>
            <div className="text-4xl font-bold tabular-nums mb-4">{mm}:{ss}</div>
            <div className="h-16 flex items-end justify-center gap-[3px] mb-5" aria-hidden>
              {bars.map((h, i) => (
                <div key={i} className="w-1.5 rounded-full bg-primary/70" style={{ height: `${h * 100}%`, opacity: phase === "recording" ? 1 : 0.4 }} />
              ))}
            </div>

            {phase === "idle" && (
              <button onClick={start} className="h-20 w-20 mx-auto rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 tap">
                <Mic className="h-9 w-9" />
              </button>
            )}
            {phase === "recording" && (
              <div className="flex justify-center gap-3">
                <button onClick={pause} className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center"><Pause className="h-6 w-6" /></button>
                <button onClick={stop} className="h-20 w-20 rounded-full bg-destructive text-destructive-foreground grid place-items-center animate-pulse"><Square className="h-8 w-8" /></button>
                <button onClick={discard} className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center"><Trash2 className="h-6 w-6" /></button>
              </div>
            )}
            {phase === "paused" && (
              <div className="flex justify-center gap-3">
                <button onClick={resume} className="h-20 w-20 rounded-full bg-primary text-primary-foreground grid place-items-center"><Play className="h-8 w-8" /></button>
                <button onClick={stop} className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center"><Square className="h-6 w-6" /></button>
                <button onClick={discard} className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center"><Trash2 className="h-6 w-6" /></button>
              </div>
            )}
            {phase === "done" && (
              <div className="flex justify-center gap-3">
                <button className="h-14 w-14 rounded-full bg-ink text-ink-foreground grid place-items-center"><Play className="h-6 w-6" /></button>
                <button onClick={start} className="h-14 w-14 rounded-full bg-surface-2 border border-border grid place-items-center"><Mic className="h-6 w-6" /></button>
              </div>
            )}
          </div>

          <button onClick={() => setPhase("denied")} className="text-[12px] text-muted-foreground underline mx-auto block">İzin reddedildiyse →</button>
        </>
      )}
    </FocusSheet>
  );
}

/* ---------------- AI extract preview ---------------- */

export function AiExtractPreview({ transcript, initial, onClose, onCreate }: {
  transcript: string;
  initial?: Partial<Record<"type" | "machine" | "location" | "symptom" | "title" | "description" | "priority", string>>;
  onClose: () => void;
  onCreate: (fields: Record<string, string>) => void;
}) {
  const [f, setF] = useState({
    type: initial?.type ?? "ariza",
    machine: initial?.machine ?? "Konveyör Bandı 7",
    location: initial?.location ?? "Tesis 1 / A Blok / Hat 3",
    symptom: initial?.symptom ?? "Yüksek titreşim ve ses",
    title: initial?.title ?? "Konveyör 7 — Yüksek titreşim",
    description: initial?.description ?? transcript,
    priority: initial?.priority ?? "yuksek",
  });
  return (
    <FocusSheet
      title="Kontrol et ve kayıt oluştur"
      onClose={onClose}
      footer={<button className="btn btn-primary w-full" onClick={() => onCreate(f)}>Kontrol et ve kayıt oluştur</button>}
    >
      <div className="card-soft p-4 mb-3 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary" /><div className="text-[11px] uppercase tracking-widest opacity-70">ToolA çıkarımı</div></div>
        <div className="text-[13px] opacity-80">Aşağıdaki alanlar yaptığın anlatımdan otomatik dolduruldu. Her birini düzenleyebilirsin.</div>
      </div>
      {transcript && (
        <div className="card-soft p-3 mb-3">
          <div className="label mb-1">Anlatımın</div>
          <div className="text-sm">{transcript}</div>
        </div>
      )}
      <div className="space-y-3">
        {([
          ["type", "İş türü"],
          ["machine", "Makine"],
          ["location", "Lokasyon"],
          ["symptom", "Belirti / ihtiyaç"],
          ["title", "Başlık"],
          ["priority", "Öncelik"],
        ] as const).map(([k, label]) => (
          <div key={k}>
            <label className="label block mb-1">{label}</label>
            <input className="input" value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <div>
          <label className="label block mb-1">Açıklama</label>
          <textarea className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} />
        </div>
      </div>
    </FocusSheet>
  );
}

/* ---------------- Camera capture ---------------- */

export function CameraCaptureSheet({ onClose, onDone }: { onClose: () => void; onDone: (photos: { id: string; label: string }[], note: string) => void }) {
  const [photos, setPhotos] = useState<{ id: string; label: string }[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [denied, setDenied] = useState(false);

  function capture() {
    const id = `p-${Date.now()}`;
    setPreview(id);
  }
  function keep() {
    if (!preview) return;
    setPhotos((ps) => [...ps, { id: preview, label: `Fotoğraf ${ps.length + 1}` }]);
    setPreview(null);
  }
  function retake() { setPreview(null); }
  function remove(id: string) { setPhotos((ps) => ps.filter((p) => p.id !== id)); }

  return (
    <FocusSheet
      title="Fotoğraf çek"
      onClose={onClose}
      footer={photos.length > 0 ? <button className="btn btn-primary w-full" onClick={() => onDone(photos, note)}>Devam et ({photos.length} fotoğraf)</button> : null}
    >
      {denied ? (
        <div className="card-soft p-5 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
          <div className="font-semibold mb-1">Kamera izni reddedildi</div>
          <p className="text-sm text-muted-foreground mb-3">Tarayıcı izinlerinden ToolA için kamera erişimine izin ver.</p>
          <button className="btn btn-ghost w-full" onClick={() => setDenied(false)}>Tekrar dene</button>
        </div>
      ) : (
        <>
          <div className="relative aspect-[3/4] rounded-3xl bg-ink overflow-hidden grid place-items-center text-ink-foreground/60 mb-3">
            {preview ? (
              <div className="absolute inset-0 grid place-items-center text-ink-foreground/80">
                <div className="text-center">
                  <div className="text-5xl mb-2">📷</div>
                  <div className="text-sm">Önizleme</div>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute inset-6 border-2 border-dashed border-ink-foreground/30 rounded-2xl" />
                <div className="text-center z-10">
                  <Camera className="h-10 w-10 mx-auto mb-2 opacity-70" />
                  <div className="text-sm">Kameraya hizala</div>
                </div>
              </>
            )}
          </div>
          {preview ? (
            <div className="flex justify-center gap-3 mb-4">
              <button onClick={retake} className="btn btn-ghost"><RefreshCw className="h-4 w-4" /> Yeniden çek</button>
              <button onClick={keep} className="btn btn-primary">Bu fotoğrafı kullan</button>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <button onClick={capture} className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30">
                <Camera className="h-7 w-7" />
              </button>
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square bg-surface-2 rounded-2xl overflow-hidden border border-border grid place-items-center text-2xl">
                  📷
                  <button onClick={() => remove(p.id)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-ink text-ink-foreground grid place-items-center text-xs">×</button>
                </div>
              ))}
              <button onClick={() => setPreview(`p-${Date.now()}`)} className="aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-muted-foreground">
                <Plus className="h-6 w-6" />
              </button>
            </div>
          )}

          <label className="label block mb-1">Sesli ya da yazılı not (opsiyonel)</label>
          <textarea className="input mb-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fotoğrafta ne göstermek istiyorsun?" rows={3} />
          <button onClick={() => setDenied(true)} className="text-[12px] text-muted-foreground underline">Kamera izni alamadıysan →</button>
        </>
      )}
    </FocusSheet>
  );
}

/* ---------------- QR scanner ---------------- */

export function QrScannerSheet({ onClose, onMachine }: { onClose: () => void; onMachine: (m: typeof MOCK_MACHINES[number]) => void }) {
  const [phase, setPhase] = useState<"scan" | "manual" | "notfound">("scan");
  const [code, setCode] = useState("");
  const [flash, setFlash] = useState(false);

  function simulateScan() {
    // Cycle through known machines for the demo
    const m = MOCK_MACHINES[Math.floor(Math.random() * MOCK_MACHINES.length)];
    onMachine(m);
  }
  function tryManual() {
    const m = MOCK_MACHINES.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (m) onMachine(m);
    else setPhase("notfound");
  }

  return (
    <FocusSheet title="QR ile tara" onClose={onClose}>
      {phase === "scan" && (
        <>
          <div className="relative aspect-square rounded-3xl bg-ink overflow-hidden mb-3 grid place-items-center">
            <div className="absolute inset-8 border-2 border-primary rounded-2xl" />
            <ScanLine className="h-10 w-10 text-ink-foreground/70" />
            <div className="absolute top-3 right-3">
              <button onClick={() => setFlash((f) => !f)} className={`h-10 w-10 rounded-full grid place-items-center ${flash ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"}`}>
                <FlashlightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={simulateScan} className="btn btn-primary w-full">Demo: bir makine taradım</button>
            <button onClick={() => setPhase("manual")} className="btn btn-ghost w-full"><KeyRound className="h-4 w-4" /> Kodu manuel gir</button>
          </div>
        </>
      )}
      {phase === "manual" && (
        <div className="card-soft p-4">
          <label className="label block mb-1">Ekipman kodu</label>
          <input className="input mb-3" value={code} onChange={(e) => setCode(e.target.value)} placeholder="KNV-007" />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => setPhase("scan")}>Geri</button>
            <button className="btn btn-primary" onClick={tryManual} disabled={!code.trim()}>Ara</button>
          </div>
        </div>
      )}
      {phase === "notfound" && (
        <div className="card-soft p-5 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-warning mb-2" />
          <div className="font-semibold mb-1">QR okunamadı veya makine bulunamadı</div>
          <p className="text-sm text-muted-foreground mb-3">Etiket hasarlıysa kodu manuel girebilir ya da makineyi listeden seçebilirsin.</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => setPhase("scan")}>Tekrar tara</button>
            <button className="btn btn-primary" onClick={() => setPhase("manual")}>Manuel gir</button>
          </div>
        </div>
      )}
    </FocusSheet>
  );
}

/* ---------------- QR result machine card ---------------- */

export function QrMachineResult({ m, onClose, onCreate, onHistory }: {
  m: typeof MOCK_MACHINES[number]; onClose: () => void; onCreate: () => void; onHistory: () => void;
}) {
  return (
    <FocusSheet title="Makine bulundu" onClose={onClose}>
      <div className="card-soft p-4 mb-3">
        <div className="font-bold text-lg">{m.name}</div>
        <div className="text-sm text-muted-foreground">{m.code} • {m.model}</div>
        <div className="grid grid-cols-2 gap-2 text-[12px] mt-3">
          <KV label="Seri No" value={m.serial} />
          <KV label="Lokasyon" value={m.location} />
          <KV label="Durum" value={m.status} />
          <KV label="Açık iş" value={String(m.openWork)} />
          <KV label="Son müdahale" value={m.lastIntervention} />
          <KV label="Tekrarlayan" value="Yüksek titreşim" />
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={onCreate} className="btn btn-primary w-full">Bu makine için kayıt oluştur</button>
        <button onClick={onHistory} className="btn btn-ghost w-full">Makine geçmişini aç</button>
      </div>
    </FocusSheet>
  );
}
function KV({ label, value }: { label: string; value: string }) {
  return <div><div className="label">{label}</div><div className="font-medium truncate">{value}</div></div>;
}
