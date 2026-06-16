import { useState } from "react";
import { useMock } from "@/lib/mock";
import { PartPicker } from "./Pickers";
import { Package, UserCog, Users2, Lock, RotateCcw, ArrowLeftRight, Camera, Send, BellRing, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { k: "parca", label: "Parça gerekli", icon: Package },
  { k: "uzman", label: "Uzman desteği", icon: UserCog },
  { k: "ekip", label: "Başka ekip gerekli", icon: Users2 },
  { k: "erisim", label: "Erişim yok", icon: Lock },
  { k: "tekraryok", label: "Arıza tekrar üretilemedi", icon: RotateCcw },
  { k: "vardiya", label: "Vardiya devri", icon: ArrowLeftRight },
] as const;

export function SupportFlow({ workId, onBack }: { workId: string; onBack: () => void }) {
  const { getDraft, updateDraft } = useMock();
  const draft = getDraft(workId);
  const support = draft?.support;
  const [cat, setCat] = useState<string | null>(support?.category ?? null);
  const [picker, setPicker] = useState(false);
  const [body, setBody] = useState<Record<string, any>>(support?.body ?? {});

  if (support) return <WaitingScreen workId={workId} onBack={onBack} />;

  function submit() {
    if (!cat) return;
    updateDraft(workId, {
      support: {
        category: cat,
        body,
        waitingSince: new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        timeline: [{ at: "Şimdi", text: `${CATEGORIES.find((c) => c.k === cat)!.label} talebi oluşturuldu` }],
      },
    });
    toast.success("Talep oluşturuldu — ilgili kişi/ekip bilgilendirildi");
  }

  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="font-semibold mb-2">Destek nedeni</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.k} onClick={() => setCat(c.k)} className={`card-soft p-3 text-left tap ${cat === c.k ? "ring-2 ring-primary" : ""}`}>
              <c.icon className="h-5 w-5 mb-2" />
              <div className="font-semibold text-sm">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {cat === "parca" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Parça talebi</div>
          <button className="btn btn-ghost w-full justify-between" onClick={() => setPicker(true)}>
            {body.part?.name ?? "Parça seç"} <span className="text-muted-foreground text-xs">{body.part?.code ?? ""}</span>
          </button>
          <input className="input" placeholder="Adet" value={body.qty ?? ""} onChange={(e) => setBody({ ...body, qty: e.target.value })} />
          <select className="input" value={body.urgency ?? "normal"} onChange={(e) => setBody({ ...body, urgency: e.target.value })}>
            <option value="dusuk">Düşük</option><option value="normal">Normal</option><option value="yuksek">Yüksek</option><option value="kritik">Kritik</option>
          </select>
          <button className="btn btn-ghost w-full"><Camera className="h-4 w-4" /> Fotoğraf ekle</button>
          <textarea className="input" placeholder="Talep notu" rows={3} value={body.note ?? ""} onChange={(e) => setBody({ ...body, note: e.target.value })} />
          {picker && <PartPicker onPick={(p) => { setBody({ ...body, part: p }); setPicker(false); }} onClose={() => setPicker(false)} />}
        </div>
      )}

      {cat === "uzman" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Uzman desteği</div>
          <input className="input" placeholder="Gerekli uzmanlık (ör. PLC programlama)" value={body.expertise ?? ""} onChange={(e) => setBody({ ...body, expertise: e.target.value })} />
          <textarea className="input" placeholder="Sorun özeti" rows={3} value={body.summary ?? ""} onChange={(e) => setBody({ ...body, summary: e.target.value })} />
          <input className="input" placeholder="Paylaşılacak kanıt (ör. video-1, ölçüm-2)" value={body.evidence ?? ""} onChange={(e) => setBody({ ...body, evidence: e.target.value })} />
          <input className="input" placeholder="Hedef kişi / ekip" value={body.target ?? ""} onChange={(e) => setBody({ ...body, target: e.target.value })} />
        </div>
      )}

      {cat === "vardiya" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Vardiya devri</div>
          <input className="input" placeholder="Devralacak teknisyen" value={body.receiver ?? ""} onChange={(e) => setBody({ ...body, receiver: e.target.value })} />
          <textarea className="input" placeholder="Mevcut durum" rows={2} value={body.condition ?? ""} onChange={(e) => setBody({ ...body, condition: e.target.value })} />
          <textarea className="input" placeholder="Tamamlanan kontroller" rows={2} value={body.checks ?? ""} onChange={(e) => setBody({ ...body, checks: e.target.value })} />
          <textarea className="input" placeholder="Önerilen sonraki adım" rows={2} value={body.next ?? ""} onChange={(e) => setBody({ ...body, next: e.target.value })} />
        </div>
      )}

      {cat && cat !== "parca" && cat !== "uzman" && cat !== "vardiya" && (
        <div className="card-soft p-4">
          <textarea className="input" placeholder="Detay" rows={4} value={body.detail ?? ""} onChange={(e) => setBody({ ...body, detail: e.target.value })} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-ghost" onClick={onBack}>Vazgeç</button>
        <button className="btn btn-primary" disabled={!cat} onClick={submit}><Send className="h-4 w-4" /> Talebi oluştur</button>
      </div>
    </div>
  );
}

function WaitingScreen({ workId, onBack }: { workId: string; onBack: () => void }) {
  const { getDraft, updateDraft } = useMock();
  const draft = getDraft(workId);
  const s = draft?.support;
  if (!s) return null;

  function push(text: string) {
    updateDraft(workId, {
      support: { ...s!, timeline: [{ at: "Şimdi", text }, ...s!.timeline] },
    });
  }
  function resume() { updateDraft(workId, { support: null }); onBack(); }

  return (
    <div className="space-y-3">
      <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><BellRing className="h-4 w-4 text-primary" /><div className="text-[11px] uppercase tracking-widest opacity-70">Bekleme durumunda</div></div>
        <div className="font-semibold capitalize">{CATEGORIES.find((c) => c.k === s.category)?.label}</div>
        <div className="text-[12px] opacity-80 mt-1">Talep oluşturuldu: {s.waitingSince}</div>
        <div className="text-[12px] opacity-80">Sorumlu: Depo / Uzman • Beklenen yanıt: 2 saat içinde</div>
      </div>

      <div className="card-soft p-4">
        <div className="font-semibold mb-2">Zaman çizelgesi</div>
        <ul className="space-y-2 text-sm">
          {s.timeline.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div><div>{t.text}</div><div className="text-[11px] text-muted-foreground">{t.at}</div></div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-ghost" onClick={() => { push("Parça geldi"); toast.success("Parça geldi"); }}>Parça geldi</button>
        <button className="btn btn-ghost" onClick={() => { push("Uzman yanıtladı"); toast.success("Yanıt geldi"); }}>Yanıt geldi</button>
        <button className="btn btn-ghost" onClick={() => { push("Hatırlatma gönderildi"); toast.success("Hatırlatma gönderildi"); }}><BellRing className="h-4 w-4" /> Hatırlat</button>
        <button className="btn btn-primary" onClick={resume}><CheckCircle2 className="h-4 w-4" /> İşe devam et</button>
      </div>
    </div>
  );
}
