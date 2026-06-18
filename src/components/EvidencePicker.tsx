import { useState } from "react";
import { BottomSheet } from "./FocusSheet";
import type { DraftEvidence } from "@/lib/mock";
import { Camera, Video, Mic, Gauge, AlertOctagon, FileText, Barcode, X, Play, Trash2, ExternalLink } from "lucide-react";

const KINDS = [
  { k: "foto", label: "Fotoğraf", icon: Camera },
  { k: "video", label: "Video", icon: Video },
  { k: "ses", label: "Ses", icon: Mic },
  { k: "olcum", label: "Ölçüm", icon: Gauge },
  { k: "hata_kodu", label: "Hata kodu", icon: AlertOctagon },
  { k: "belge", label: "Belge", icon: FileText },
  { k: "barkod", label: "Barkod / Seri", icon: Barcode },
] as const;

const SIDES = [
  { k: "once", label: "Önce" },
  { k: "sirasinda", label: "Sırasında" },
  { k: "sonra", label: "Sonra" },
] as const;

export function EvidencePicker({ onAdd, onClose }: { onAdd: (e: DraftEvidence) => void; onClose: () => void }) {
  const [kind, setKind] = useState<DraftEvidence["kind"] | null>(null);
  const [side, setSide] = useState<DraftEvidence["side"]>("once");
  const [value, setValue] = useState("");
  const [meas, setMeas] = useState({ value: "", unit: "mm/s", refLow: "", refHigh: "", device: "Vibrometre VB-200" });

  function commit() {
    if (!kind) return;
    let label: string = KINDS.find((k) => k.k === kind)!.label;
    let val = value;
    if (kind === "olcum") {
      label = `${meas.value} ${meas.unit}`;
      val = `Ölçüm cihazı: ${meas.device} • Referans: ${meas.refLow}-${meas.refHigh} ${meas.unit}`;
    } else if (!val && kind === "foto") {
      val = "Saha fotoğrafı (demo)";
    }
    onAdd({ id: `ev-${Date.now()}`, kind, side, label, value: val });
    onClose();
  }

  const measStatus = (() => {
    const v = parseFloat(meas.value);
    const lo = parseFloat(meas.refLow);
    const hi = parseFloat(meas.refHigh);
    if (isNaN(v) || isNaN(lo) || isNaN(hi)) return null;
    if (v < lo) return { tone: "warning", text: "Düşük" };
    if (v > hi) return { tone: "danger", text: "Yüksek" };
    return { tone: "success", text: "Normal" };
  })();

  return (
    <BottomSheet title="Kanıt ekle" onClose={onClose}>
      {!kind ? (
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((K) => (
            <button key={K.k} onClick={() => setKind(K.k as any)} className="card-soft p-3 grid place-items-center gap-1 text-center tap">
              <K.icon className="h-5 w-5" />
              <span className="text-[12px] font-semibold">{K.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{KINDS.find((k) => k.k === kind)!.label} ekle</div>
            <button onClick={() => setKind(null)} className="text-sm text-muted-foreground">Değiştir</button>
          </div>
          <div className="flex gap-2 mb-3">
            {SIDES.map((s) => (
              <button key={s.k} onClick={() => setSide(s.k)} className={`pill flex-1 justify-center ${side === s.k ? "pill-ink" : ""}`}>{s.label}</button>
            ))}
          </div>

          {kind === "olcum" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Değer" value={meas.value} onChange={(e) => setMeas({ ...meas, value: e.target.value })} />
                <input className="input" placeholder="Birim" value={meas.unit} onChange={(e) => setMeas({ ...meas, unit: e.target.value })} />
                <input className="input" placeholder="Ref. min" value={meas.refLow} onChange={(e) => setMeas({ ...meas, refLow: e.target.value })} />
                <input className="input" placeholder="Ref. max" value={meas.refHigh} onChange={(e) => setMeas({ ...meas, refHigh: e.target.value })} />
              </div>
              <input className="input" placeholder="Ölçüm cihazı" value={meas.device} onChange={(e) => setMeas({ ...meas, device: e.target.value })} />
              {measStatus && (
                <div className={`pill ${measStatus.tone === "danger" ? "pill-danger" : measStatus.tone === "warning" ? "pill-warning" : "pill-success"}`}>
                  {measStatus.text}
                </div>
              )}
            </div>
          ) : (
            <textarea className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder={
              kind === "hata_kodu" ? "Örn. E-117 / Aşırı yük" :
              kind === "barkod" ? "Seri numarası veya barkod" :
              kind === "belge" ? "Belge adı (demo)" :
              kind === "foto" ? "Açıklama (opsiyonel)" :
              kind === "video" ? "Video kısa açıklaması" :
              "Ses kaydı notu"
            } rows={3} />
          )}

          <button className="btn btn-primary w-full mt-3" onClick={commit} disabled={kind === "olcum" ? !meas.value : false}>
            Kanıtı ekle
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

export function EvidenceGrid({ items, onRemove, onPreview }: { items: DraftEvidence[]; onRemove?: (id: string) => void; onPreview?: (e: DraftEvidence) => void }) {
  if (items.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground text-center">Henüz kanıt eklenmedi.</div>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((e) => {
        const K = KINDS.find((k) => k.k === e.kind);
        const Icon = K?.icon ?? Camera;
        return (
          <button key={e.id} onClick={() => onPreview?.(e)} className="relative aspect-square rounded-2xl bg-surface-2 border border-border grid place-items-center p-2 text-center tap">
            <Icon className="h-5 w-5 mb-1" />
            <div className="text-[11px] font-semibold truncate w-full">{e.label}</div>
            <div className="text-[10px] text-muted-foreground">{e.side === "once" ? "Önce" : e.side === "sonra" ? "Sonra" : "Sırasında"}</div>
            {onRemove && (
              <button
                onClick={(ev) => { ev.stopPropagation(); onRemove(e.id); }}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-ink text-ink-foreground grid place-items-center"
              ><X className="h-3 w-3" /></button>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EvidencePreview({ e, onClose, onRemove, onGotoStep }: {
  e: DraftEvidence;
  onClose: () => void;
  onRemove?: (id: string) => void;
  onGotoStep?: (stepId: string) => void;
}) {
  const K = KINDS.find((k) => k.k === e.kind);
  const Icon = K?.icon ?? Camera;
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-black grid place-items-center" onClick={() => setFullscreen(false)}>
        <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white grid place-items-center"><X className="h-5 w-5" /></button>
        {e.kind === "foto" ? (
          <div className="text-white text-6xl">📷</div>
        ) : e.kind === "video" ? (
          <div className="text-white text-6xl">🎬</div>
        ) : (
          <Icon className="h-20 w-20 text-white/80" />
        )}
        <div className="absolute bottom-6 left-0 right-0 text-center text-white">
          <div className="font-semibold">{e.label}</div>
          <div className="text-[12px] opacity-70 mt-1">{e.value}</div>
        </div>
      </div>
    );
  }

  return (
    <BottomSheet title="Kanıt önizleme" onClose={onClose}>
      <button onClick={() => setFullscreen(true)} className="block w-full aspect-video rounded-2xl bg-ink text-ink-foreground grid place-items-center mb-3 tap">
        {e.kind === "foto" ? <div className="text-5xl">📷</div> : e.kind === "video" ? <div className="text-5xl">🎬</div> : <Icon className="h-10 w-10 opacity-70" />}
      </button>

      {e.kind === "video" && (
        <div className="rounded-2xl bg-surface-2 p-3 mb-3 flex items-center gap-2">
          <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center"><Play className="h-4 w-4" /></button>
          <div className="text-[12px] text-muted-foreground">Video oynatıcı (demo)</div>
        </div>
      )}
      {e.kind === "ses" && (
        <div className="rounded-2xl bg-surface-2 p-3 mb-3 flex items-center gap-2">
          <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center"><Play className="h-4 w-4" /></button>
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full w-1/3 bg-primary" /></div>
          <div className="text-[12px] text-muted-foreground">0:00 / 0:24</div>
        </div>
      )}

      <div className="card-soft p-3 text-sm mb-3 space-y-1">
        <div><span className="text-muted-foreground">Tür:</span> {K?.label}</div>
        <div><span className="text-muted-foreground">Aşama:</span> {e.side === "once" ? "Önce" : e.side === "sonra" ? "Sonra" : "Sırasında"}</div>
        <div><span className="text-muted-foreground">Etiket:</span> {e.label}</div>
        {e.value && <div className="whitespace-pre-wrap text-[13px] text-muted-foreground">{e.value}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setFullscreen(true)} className="btn btn-ghost"><ExternalLink className="h-4 w-4" /> Tam ekran</button>
        {e.stepId && onGotoStep && (
          <button onClick={() => { onGotoStep(e.stepId!); onClose(); }} className="btn btn-ghost">Adıma git</button>
        )}
        {onRemove && (
          <button onClick={() => { onRemove(e.id); onClose(); }} className="btn col-span-2 text-destructive"><Trash2 className="h-4 w-4" /> Kanıtı kaldır</button>
        )}
      </div>
    </BottomSheet>
  );
}
