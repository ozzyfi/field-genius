import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMock } from "@/lib/mock";
import { Screen } from "@/components/AppShell";
import { WORK_TYPE_LABEL, genWorkCode } from "@/lib/toola";
import { toast } from "sonner";
import {
  Mic, Camera, QrCode, Type, AlertTriangle, Wrench, ClipboardCheck, PackagePlus, Replace, MoreHorizontal, MapPin,
} from "lucide-react";
import { VoiceRecorderSheet, AiExtractPreview, CameraCaptureSheet, QrScannerSheet, QrMachineResult } from "@/components/QuickFlows";
import { MachinePicker, LocationPicker } from "@/components/Pickers";

export const Route = createFileRoute("/_app/yeni")({
  ssr: false,
  component: YeniPage,
});

const TYPES = [
  { k: "ariza", icon: AlertTriangle, color: "text-destructive" },
  { k: "bakim", icon: Wrench, color: "text-primary" },
  { k: "test", icon: ClipboardCheck, color: "text-foreground" },
  { k: "kurulum", icon: PackagePlus, color: "text-foreground" },
  { k: "parca", icon: Replace, color: "text-foreground" },
  { k: "diger", icon: MoreHorizontal, color: "text-muted-foreground" },
] as const;

type QuickFlow = null | "voice" | "voice-preview" | "camera" | "camera-preview" | "qr" | "qr-result";

function YeniPage() {
  const { user, profile } = useAuth();
  const { updateDraft } = useMock();
  const navigate = useNavigate();
  const [type, setType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("normal");
  const [plan, setPlan] = useState<"now" | "planned">("now");
  const [planDate, setPlanDate] = useState("");
  const [machine, setMachine] = useState<{ id: string; name: string; location: string; code?: string; model?: string; serial?: string } | null>(null);
  const [location, setLocation] = useState<{ label: string } | null>(null);
  const [machinePicker, setMachinePicker] = useState(false);
  const [locationPicker, setLocationPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const [flow, setFlow] = useState<QuickFlow>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [cameraPayload, setCameraPayload] = useState<{ count: number; note: string } | null>(null);
  const [qrMachine, setQrMachine] = useState<any>(null);

  async function create(fields?: Record<string, string>) {
    const _type = fields?.type ?? type ?? "ariza";
    const _title = (fields?.title ?? title).trim();
    const _desc = (fields?.description ?? desc).trim();
    if (!_title || !profile?.org_id) return;
    setBusy(true);
    const code = genWorkCode(_type);

    // Try to resolve a machine_id from the picked machine (by name); if not, leave null.
    let machine_id: string | null = null;
    const pickedName = (fields?.machineName) ?? machine?.name ?? qrMachine?.name;
    if (pickedName) {
      try {
        const { data: m } = await supabase.from("machines").select("id, name, location, model, serial").eq("name", pickedName).maybeSingle();
        if (m) machine_id = m.id;
      } catch {}
    }

    const { data, error } = await supabase
      .from("work_records")
      .insert({
        org_id: profile.org_id, code, type: _type as any,
        title: _title, description: _desc || null,
        source: "teknisyen" as any, status: "devam_ediyor" as any,
        created_by: user?.id, assigned_to: user?.id,
        priority: (fields?.priority ?? priority) as any,
        location_note: fields?.location ?? location?.label ?? null,
        machine_id,
      })
      .select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);

    // Persist front-end-only fields in the local draft (plannedAt, machine details, work location).
    const m = machine ?? (qrMachine ? { id: qrMachine.id ?? "qr", name: qrMachine.name, location: qrMachine.location, code: qrMachine.code, model: qrMachine.model, serial: qrMachine.serial } : null);
    updateDraft(data!.id, {
      workType: _type as any,
      machine: m,
      workLocation: fields?.location ?? location?.label ?? m?.location ?? null,
      plannedAt: plan === "planned" && planDate ? new Date(planDate).toISOString() : null,
      immediate: plan === "now",
      workflowStatus: "devam_ediyor",
      accepted: true,
    });

    toast.success("Kayıt oluşturuldu");
    navigate({ to: "/is/$id", params: { id: data!.id } });
  }

  if (!type) {
    return (
      <Screen title="Yeni Kayıt">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Ne kaydetmek istiyorsun?</h1>
        <p className="text-sm text-muted-foreground mb-5">Sahada hızlı kayıt oluştur. Sonra ses, fotoğraf veya QR ile zenginleştirebilirsin.</p>

        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.k} onClick={() => setType(t.k)} className="card-soft p-4 text-left active:scale-[0.98] tap">
                <Icon className={`h-7 w-7 mb-3 ${t.color}`} />
                <div className="font-semibold">{WORK_TYPE_LABEL[t.k]}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">Hızlı oluştur</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="section-title mb-2">Hızlı giriş</div>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setFlow("voice")} className="card-soft p-3 grid place-items-center gap-1 text-[11px] font-semibold tap"><Mic className="h-5 w-5" />Sesle</button>
            <button onClick={() => setFlow("camera")} className="card-soft p-3 grid place-items-center gap-1 text-[11px] font-semibold tap"><Camera className="h-5 w-5" />Fotoğraf</button>
            <button onClick={() => setFlow("qr")} className="card-soft p-3 grid place-items-center gap-1 text-[11px] font-semibold tap"><QrCode className="h-5 w-5" />QR</button>
            <button onClick={() => setType("ariza")} className="card-soft p-3 grid place-items-center gap-1 text-[11px] font-semibold tap"><Type className="h-5 w-5" />Yazarak</button>
          </div>
        </div>

        {flow === "voice" && (
          <VoiceRecorderSheet
            hint="Ne gördün veya ne kaydetmek istediğini sesli anlat. ToolA başlık, makine ve belirti tahmini çıkarır."
            onClose={() => setFlow(null)}
            onDone={({ transcript }) => { setVoiceTranscript(transcript); setFlow("voice-preview"); }}
          />
        )}
        {flow === "voice-preview" && (
          <AiExtractPreview transcript={voiceTranscript} onClose={() => setFlow(null)} onCreate={(f) => create({ ...f, machineName: f.machine })} />
        )}
        {flow === "camera" && (
          <CameraCaptureSheet
            onClose={() => setFlow(null)}
            onDone={(photos, note) => { setCameraPayload({ count: photos.length, note }); setFlow("camera-preview"); }}
          />
        )}
        {flow === "camera-preview" && cameraPayload && (
          <AiExtractPreview
            transcript={cameraPayload.note}
            initial={{ type: "ariza", title: "Fotoğraflı saha kaydı", description: `${cameraPayload.count} fotoğraf eklendi. ${cameraPayload.note}` }}
            onClose={() => setFlow(null)} onCreate={(f) => create({ ...f, machineName: f.machine })}
          />
        )}
        {flow === "qr" && (
          <QrScannerSheet onClose={() => setFlow(null)} onMachine={(m) => { setQrMachine(m); setFlow("qr-result"); }} />
        )}
        {flow === "qr-result" && qrMachine && (
          <QrMachineResult
            m={qrMachine}
            onClose={() => setFlow(null)}
            onPick={(wt) => {
              const titleByType: Record<string, string> = {
                ariza: `${qrMachine.name} — arıza`,
                bakim: `${qrMachine.name} — bakım`,
                test: `${qrMachine.name} — test/kontrol`,
                kurulum: `${qrMachine.name} — kurulum`,
                parca: `${qrMachine.name} — parça değişimi`,
                diger: `${qrMachine.name} — gözlem`,
              };
              create({ type: wt, title: titleByType[wt], description: `Makine: ${qrMachine.name} (${qrMachine.code})`, location: qrMachine.location, machineName: qrMachine.name });
            }}
            onHistory={() => { setFlow(null); navigate({ to: "/gecmis" }); }}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen title={`Yeni ${WORK_TYPE_LABEL[type]}`} back={() => setType(null)}>
      <div className="card-soft p-4 space-y-4">
        <div>
          <label className="label block mb-1">Başlık</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Hat 3 konveyör titreşimi" />
        </div>
        <div>
          <label className="label block mb-1">Kısa açıklama</label>
          <textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ne gördün veya yapman gerekiyor?" />
        </div>

        <div>
          <label className="label block mb-1">Makine</label>
          <button onClick={() => setMachinePicker(true)} className="btn btn-ghost w-full justify-between">
            {machine ? machine.name : "Makine bağla"} <span className="text-muted-foreground text-xs">{machine?.location ?? ""}</span>
          </button>
        </div>
        <div>
          <label className="label block mb-1">Lokasyon</label>
          <button onClick={() => setLocationPicker(true)} className="btn btn-ghost w-full justify-between">
            <span className="truncate">{location?.label ?? "Lokasyon seç"}</span><MapPin className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div>
          <label className="label block mb-1">Öncelik</label>
          <div className="flex gap-2">
            {(["dusuk", "normal", "yuksek", "kritik"] as const).map((p) => (
              <button key={p} onClick={() => setPriority(p)} className={`pill flex-1 justify-center capitalize ${priority === p ? "pill-ink" : ""}`}>{p}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="label block mb-1">Zamanlama</label>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setPlan("now")} className={`pill flex-1 justify-center ${plan === "now" ? "pill-ink" : ""}`}>Hemen</button>
            <button onClick={() => setPlan("planned")} className={`pill flex-1 justify-center ${plan === "planned" ? "pill-ink" : ""}`}>Planla</button>
          </div>
          {plan === "planned" && (
            <input type="datetime-local" className="input" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
          )}
        </div>

        <button className="btn btn-ghost w-full" onClick={() => setFlow("camera")}><Camera className="h-4 w-4" /> Fotoğraf ekle</button>

        <button disabled={busy || !title.trim() || (plan === "planned" && !planDate)} onClick={() => create()} className="btn btn-primary w-full">
          {busy ? "Oluşturuluyor…" : "Kaydı oluştur ve aç"}
        </button>
      </div>

      {machinePicker && (
        <MachinePicker
          onClose={() => setMachinePicker(false)}
          onScanQr={() => { setMachinePicker(false); setFlow("qr"); }}
          onPick={(m) => { setMachine({ id: m.id, name: m.name, location: m.location, code: m.code, model: m.model, serial: m.serial }); if (!location) setLocation({ label: m.location }); setMachinePicker(false); }}
        />
      )}
      {locationPicker && (
        <LocationPicker onClose={() => setLocationPicker(false)} onPick={(l) => { setLocation({ label: l.label }); setLocationPicker(false); }} />
      )}
      {flow === "camera" && (
        <CameraCaptureSheet
          onClose={() => setFlow(null)}
          onDone={(photos, note) => { toast.success(`${photos.length} fotoğraf eklendi`); if (note && !desc) setDesc(note); setFlow(null); }}
        />
      )}
    </Screen>
  );
}
