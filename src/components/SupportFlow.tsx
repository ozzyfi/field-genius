import { useState } from "react";
import { useMock, type SupportCategory } from "@/lib/mock";
import { PartPicker } from "./Pickers";
import { Package, UserCog, Users2, Lock, RotateCcw, ArrowLeftRight, Camera, Send, BellRing, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: { k: SupportCategory; label: string; icon: any }[] = [
  { k: "parca", label: "Parça gerekli", icon: Package },
  { k: "uzman", label: "Uzman desteği", icon: UserCog },
  { k: "ekip", label: "Başka ekip gerekli", icon: Users2 },
  { k: "erisim", label: "Erişim yok", icon: Lock },
  { k: "tekraryok", label: "Arıza tekrar üretilemedi", icon: RotateCcw },
  { k: "vardiya", label: "Vardiya devri", icon: ArrowLeftRight },
];

const RESOLUTIONS: Record<SupportCategory, { label: string }[]> = {
  parca: [{ label: "Parça geldi" }],
  uzman: [{ label: "Yanıt geldi" }],
  ekip: [{ label: "Ekip işi devraldı" }],
  erisim: [{ label: "Erişim sağlandı" }],
  tekraryok: [{ label: "Arıza tekrarlandı" }, { label: "Gözlem tamamlandı" }],
  vardiya: [{ label: "Devir kabul edildi" }],
};

export function SupportFlow({ workId, onBack }: { workId: string; onBack: () => void }) {
  const { getDraft, updateDraft } = useMock();
  const draft = getDraft(workId);
  const support = draft?.support;
  const [cat, setCat] = useState<SupportCategory | null>(support?.category ?? null);
  const [picker, setPicker] = useState(false);
  const [body, setBody] = useState<Record<string, any>>(support?.body ?? {});

  if (support && !support.resolved) return <WaitingScreen workId={workId} onBack={onBack} />;

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
          <input className="input" placeholder="Parça kodu" value={body.code ?? body.part?.code ?? ""} onChange={(e) => setBody({ ...body, code: e.target.value })} />
          <input className="input" placeholder="Adet" value={body.qty ?? ""} onChange={(e) => setBody({ ...body, qty: e.target.value })} />
          <select className="input" value={body.urgency ?? "normal"} onChange={(e) => setBody({ ...body, urgency: e.target.value })}>
            <option value="dusuk">Aciliyet: Düşük</option><option value="normal">Aciliyet: Normal</option><option value="yuksek">Aciliyet: Yüksek</option><option value="kritik">Aciliyet: Kritik</option>
          </select>
          <input className="input" placeholder="Hedef ekip / depo" value={body.target ?? ""} onChange={(e) => setBody({ ...body, target: e.target.value })} />
          <button className="btn btn-ghost w-full" onClick={() => toast("Fotoğraf eklendi (demo)")}><Camera className="h-4 w-4" /> Fotoğraf ekle</button>
          <textarea className="input" placeholder="Talep notu" rows={3} value={body.note ?? ""} onChange={(e) => setBody({ ...body, note: e.target.value })} />
          {picker && <PartPicker onPick={(p) => { setBody({ ...body, part: p, code: p.code }); setPicker(false); }} onClose={() => setPicker(false)} />}
        </div>
      )}

      {cat === "uzman" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Uzman desteği</div>
          <input className="input" placeholder="Gerekli uzmanlık (ör. PLC programlama)" value={body.expertise ?? ""} onChange={(e) => setBody({ ...body, expertise: e.target.value })} />
          <input className="input" placeholder="Hedef kişi / ekip" value={body.target ?? ""} onChange={(e) => setBody({ ...body, target: e.target.value })} />
          <textarea className="input" placeholder="Sorun özeti" rows={3} value={body.summary ?? ""} onChange={(e) => setBody({ ...body, summary: e.target.value })} />
          <input className="input" placeholder="Paylaşılacak kanıt (ör. video-1, ölçüm-2)" value={body.evidence ?? ""} onChange={(e) => setBody({ ...body, evidence: e.target.value })} />
          <input className="input" placeholder="Beklenen yanıt süresi (ör. 2 saat)" value={body.eta ?? ""} onChange={(e) => setBody({ ...body, eta: e.target.value })} />
        </div>
      )}

      {cat === "ekip" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Başka ekibe devir</div>
          <input className="input" placeholder="Hedef ekip" value={body.team ?? ""} onChange={(e) => setBody({ ...body, team: e.target.value })} />
          <textarea className="input" placeholder="Devir nedeni" rows={2} value={body.reason ?? ""} onChange={(e) => setBody({ ...body, reason: e.target.value })} />
          <textarea className="input" placeholder="Mevcut durum" rows={2} value={body.state ?? ""} onChange={(e) => setBody({ ...body, state: e.target.value })} />
          <textarea className="input" placeholder="Şu ana kadar yapılanlar" rows={2} value={body.done ?? ""} onChange={(e) => setBody({ ...body, done: e.target.value })} />
          <input className="input" placeholder="Eklenecek kanıt" value={body.evidence ?? ""} onChange={(e) => setBody({ ...body, evidence: e.target.value })} />
        </div>
      )}

      {cat === "erisim" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Erişim yok</div>
          <input className="input" placeholder="Gereken erişim (ör. pano anahtarı)" value={body.access ?? ""} onChange={(e) => setBody({ ...body, access: e.target.value })} />
          <input className="input" placeholder="Sorumlu departman" value={body.dept ?? ""} onChange={(e) => setBody({ ...body, dept: e.target.value })} />
          <textarea className="input" placeholder="Neden açıklaması" rows={2} value={body.reason ?? ""} onChange={(e) => setBody({ ...body, reason: e.target.value })} />
          <input className="input" placeholder="Beklenen erişim zamanı" value={body.eta ?? ""} onChange={(e) => setBody({ ...body, eta: e.target.value })} />
        </div>
      )}

      {cat === "tekraryok" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Arıza tekrar üretilemedi</div>
          <textarea className="input" placeholder="Test edilen koşullar" rows={2} value={body.conditions ?? ""} onChange={(e) => setBody({ ...body, conditions: e.target.value })} />
          <input className="input" placeholder="Gözlem süresi (ör. 30 dk)" value={body.duration ?? ""} onChange={(e) => setBody({ ...body, duration: e.target.value })} />
          <textarea className="input" placeholder="İzlenecek parametreler" rows={2} value={body.params ?? ""} onChange={(e) => setBody({ ...body, params: e.target.value })} />
          <textarea className="input" placeholder="Tekrar görülürse yapılacaklar" rows={2} value={body.ifRecur ?? ""} onChange={(e) => setBody({ ...body, ifRecur: e.target.value })} />
        </div>
      )}

      {cat === "vardiya" && (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">Vardiya devri</div>
          <input className="input" placeholder="Devralacak teknisyen" value={body.receiver ?? ""} onChange={(e) => setBody({ ...body, receiver: e.target.value })} />
          <textarea className="input" placeholder="Mevcut durum" rows={2} value={body.condition ?? ""} onChange={(e) => setBody({ ...body, condition: e.target.value })} />
          <textarea className="input" placeholder="Tamamlanan kontroller" rows={2} value={body.checks ?? ""} onChange={(e) => setBody({ ...body, checks: e.target.value })} />
          <textarea className="input" placeholder="Önerilen sonraki adım" rows={2} value={body.next ?? ""} onChange={(e) => setBody({ ...body, next: e.target.value })} />
          <input className="input" placeholder="Kanıt (foto/video)" value={body.evidence ?? ""} onChange={(e) => setBody({ ...body, evidence: e.target.value })} />
          <textarea className="input" placeholder="Devir notu" rows={2} value={body.note ?? ""} onChange={(e) => setBody({ ...body, note: e.target.value })} />
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
  const resolutions = RESOLUTIONS[s.category];

  function push(text: string) {
    updateDraft(workId, { support: { ...s!, timeline: [{ at: "Şimdi", text }, ...s!.timeline] } });
  }
  function resolve(label: string) {
    push(label);
    updateDraft(workId, { support: { ...s!, resolved: true, timeline: [{ at: "Şimdi", text: `${label} — işe devam edildi` }, ...s!.timeline] } });
    toast.success("İşe devam et");
    onBack();
  }

  const cat = CATEGORIES.find((c) => c.k === s.category)!;

  return (
    <div className="space-y-3">
      <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><BellRing className="h-4 w-4 text-primary" /><div className="text-[11px] uppercase tracking-widest opacity-70">Bekleme durumunda</div></div>
        <div className="font-semibold">{cat.label}</div>
        <div className="text-[12px] opacity-80 mt-1">Talep oluşturuldu: {s.waitingSince}</div>
        {s.body?.target && <div className="text-[12px] opacity-80">Sorumlu: {s.body.target}</div>}
        {s.body?.eta && <div className="text-[12px] opacity-80">Beklenen: {s.body.eta}</div>}
      </div>

      <div className="card-soft p-4">
        <div className="font-semibold mb-2">Talep detayı</div>
        <pre className="text-[12px] whitespace-pre-wrap text-muted-foreground">{JSON.stringify(s.body, null, 2)}</pre>
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
        <button className="btn btn-ghost" onClick={() => { push("Hatırlatma gönderildi"); toast.success("Hatırlatma gönderildi"); }}><BellRing className="h-4 w-4" /> Hatırlat</button>
        <button className="btn btn-ghost" onClick={onBack}>Kapat</button>
        {resolutions.map((r) => (
          <button key={r.label} className="btn btn-primary col-span-2" onClick={() => resolve(r.label)}>
            <CheckCircle2 className="h-4 w-4" /> {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
