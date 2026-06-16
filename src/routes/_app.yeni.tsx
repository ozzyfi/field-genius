import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Screen } from "@/components/AppShell";
import { WORK_TYPE_LABEL, genWorkCode } from "@/lib/toola";
import { toast } from "sonner";
import { Mic, Camera, QrCode, Type, AlertTriangle, Wrench, ClipboardCheck, PackagePlus, Replace, MoreHorizontal } from "lucide-react";

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

function YeniPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!type || !title.trim() || !profile?.org_id) return;
    setBusy(true);
    const code = genWorkCode(type);
    const { data, error } = await supabase
      .from("work_records")
      .insert({
        org_id: profile.org_id,
        code,
        type: type as any,
        title: title.trim(),
        description: desc.trim() || null,
        source: "teknisyen" as any,
        status: "devam_ediyor" as any,
        created_by: user?.id,
        assigned_to: user?.id,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
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
            {[
              { icon: Mic, label: "Sesle" },
              { icon: Camera, label: "Fotoğraf" },
              { icon: QrCode, label: "QR" },
              { icon: Type, label: "Yazarak" },
            ].map((q) => (
              <button key={q.label} className="card-soft p-3 grid place-items-center gap-1 text-[11px] font-semibold tap">
                <q.icon className="h-5 w-5" />
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={`Yeni ${WORK_TYPE_LABEL[type]}`}>
      <button onClick={() => setType(null)} className="text-sm text-muted-foreground mb-3">← Tür değiştir</button>
      <div className="card-soft p-4 space-y-4">
        <div>
          <label className="label block mb-1">Başlık</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Hat 3 konveyör titreşimi" />
        </div>
        <div>
          <label className="label block mb-1">Kısa açıklama</label>
          <textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ne gördün veya yapman gerekiyor?" />
        </div>
        <div className="text-[12px] text-muted-foreground">
          Ekipman henüz belli değilse boş bırakabilirsin. Lokasyonu sonra ekleyebilirsin.
        </div>
        <button disabled={busy || !title.trim()} onClick={create} className="btn btn-primary w-full">
          {busy ? "Oluşturuluyor…" : "Kaydı oluştur ve aç"}
        </button>
      </div>
    </Screen>
  );
}
