import { useState } from "react";
import { useMock, type SupportCategory } from "@/lib/mock";
import { PartPicker } from "./Pickers";
import { Package, UserCog, Users2, Lock, RotateCcw, ArrowLeftRight, Send, BellRing, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: { k: SupportCategory; label: string; icon: any }[] = [
  { k: "parca", label: "Parça gerekli", icon: Package },
  { k: "uzman", label: "Uzman desteği", icon: UserCog },
  { k: "ekip", label: "Başka ekip gerekli", icon: Users2 },
  { k: "erisim", label: "Erişim yok", icon: Lock },
  { k: "tekraryok", label: "Arıza tekrar üretilemedi", icon: RotateCcw },
  { k: "vardiya", label: "Vardiya devri", icon: ArrowLeftRight },
];

const RESOLUTIONS: Record<SupportCategory, string[]> = {
  parca: ["Parça geldi"],
  uzman: ["Yanıt geldi"],
  ekip: ["Ekip işi devraldı"],
  erisim: ["Erişim sağlandı"],
  tekraryok: ["Arıza tekrarlandı", "Gözlem tamamlandı"],
  vardiya: ["Devir kabul edildi"],
};

export function SupportFlow({ workId, onBack, initialCategory }: { workId: string; onBack: () => void; initialCategory?: SupportCategory }) {
  const { getDraft, openSupport } = useMock();
  const draft = getDraft(workId);
  const support = draft?.support;
  const [cat, setCat] = useState<SupportCategory | null>(support?.category ?? initialCategory ?? null);
  const [picker, setPicker] = useState(false);
  const [body, setBody] = useState<Record<string, any>>(support?.body ?? {});

  if (support && !support.resolved) return <WaitingScreen workId={workId} onBack={onBack} />;

  function submit() {
    if (!cat) return;
    openSupport(workId, { category: cat, body });
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

function fieldLabels(cat: SupportCategory): Record<string, string> {
  switch (cat) {
    case "parca": return { code: "Parça kodu", qty: "Adet", urgency: "Aciliyet", target: "Hedef ekip / depo", note: "Not" };
    case "uzman": return { expertise: "Uzmanlık", target: "Kişi / ekip", summary: "Özet", evidence: "Kanıt", eta: "Beklenen yanıt" };
    case "ekip": return { team: "Hedef ekip", reason: "Neden", state: "Mevcut durum", done: "Yapılanlar" };
    case "erisim": return { access: "Erişim", dept: "Departman", reason: "Açıklama", eta: "Beklenen erişim" };
    case "tekraryok": return { conditions: "Koşullar", duration: "Süre", params: "Parametreler", ifRecur: "Tekrarlarsa" };
    case "vardiya": return { receiver: "Devralan", condition: "Durum", checks: "Kontroller", next: "Sonraki adım", note: "Not" };
  }
}

function WaitingScreen({ workId, onBack }: { workId: string; onBack: () => void }) {
  const { getDraft, updateDraft, resolveSupport } = useMock();
  const draft = getDraft(workId);
  const s = draft?.support;
  if (!s) return null;
  const resolutions = RESOLUTIONS[s.category];
  const labels = fieldLabels(s.category);
  const cat = CATEGORIES.find((c) => c.k === s.category)!;

  const [resolutionForm, setResolutionForm] = useState<null | string>(null);
  const [resBody, setResBody] = useState<Record<string, any>>({});

  function push(text: string) {
    updateDraft(workId, { support: { ...s!, timeline: [{ at: "Şimdi", text }, ...s!.timeline] } });
  }
  function confirmResolve() {
    if (!resolutionForm) return;
    resolveSupport(workId, { label: resolutionForm, ...resBody });
    toast.success("İşe devam et — kaldığın adımdan devam");
    onBack();
  }

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
        <div className="space-y-1 text-sm">
          {Object.entries(labels).map(([k, lbl]) => {
            const v = s.body?.[k];
            if (!v) return null;
            return (
              <div key={k} className="flex justify-between gap-3 border-b border-border last:border-0 py-1">
                <span className="text-muted-foreground">{lbl}</span>
                <span className="text-right max-w-[60%] whitespace-pre-wrap">{String(v)}</span>
              </div>
            );
          })}
        </div>
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

      {!resolutionForm ? (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" onClick={() => { push("Hatırlatma gönderildi"); toast.success("Hatırlatma gönderildi"); }}><BellRing className="h-4 w-4" /> Hatırlat</button>
          <button className="btn btn-ghost" onClick={onBack}>Kapat</button>
          {resolutions.map((r) => (
            <button key={r} className="btn btn-primary col-span-2" onClick={() => setResolutionForm(r)}>
              <CheckCircle2 className="h-4 w-4" /> {r}
            </button>
          ))}
        </div>
      ) : (
        <div className="card-soft p-4 space-y-2">
          <div className="font-semibold mb-1">{resolutionForm}</div>
          {s.category === "parca" && (
            <>
              <input className="input" placeholder="Teslim alınan parça notu" value={resBody.received ?? ""} onChange={(e) => setResBody({ ...resBody, received: e.target.value })} />
              <input className="input" placeholder="Seri / lot" value={resBody.serial ?? ""} onChange={(e) => setResBody({ ...resBody, serial: e.target.value })} />
            </>
          )}
          {s.category === "uzman" && (
            <>
              <textarea className="input" placeholder="Uzman yanıtı / önerilen aksiyon" rows={3} value={resBody.response ?? ""} onChange={(e) => setResBody({ ...resBody, response: e.target.value })} />
              <input className="input" placeholder="Önerilen aksiyon" value={resBody.action ?? ""} onChange={(e) => setResBody({ ...resBody, action: e.target.value })} />
            </>
          )}
          {s.category === "ekip" && (
            <>
              <input className="input" placeholder="Devralan ekip" value={resBody.takenBy ?? ""} onChange={(e) => setResBody({ ...resBody, takenBy: e.target.value })} />
              <input className="input" placeholder="Devralan kişi" value={resBody.takenByPerson ?? ""} onChange={(e) => setResBody({ ...resBody, takenByPerson: e.target.value })} />
              <input className="input" placeholder="Devir tarihi/saati" value={resBody.handedAt ?? ""} onChange={(e) => setResBody({ ...resBody, handedAt: e.target.value })} />
            </>
          )}
          {s.category === "erisim" && (
            <>
              <input className="input" placeholder="Erişim sağlayan kişi" value={resBody.provider ?? ""} onChange={(e) => setResBody({ ...resBody, provider: e.target.value })} />
              <input className="input" placeholder="Erişim saati" value={resBody.atTime ?? ""} onChange={(e) => setResBody({ ...resBody, atTime: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Not (opsiyonel)" value={resBody.note ?? ""} onChange={(e) => setResBody({ ...resBody, note: e.target.value })} />
            </>
          )}
          {s.category === "tekraryok" && (
            <textarea className="input" rows={3} placeholder="Gözlem sonucu" value={resBody.observation ?? ""} onChange={(e) => setResBody({ ...resBody, observation: e.target.value })} />
          )}
          {s.category === "vardiya" && (
            <>
              <input className="input" placeholder="Devralan teknisyen" value={resBody.receiver ?? ""} onChange={(e) => setResBody({ ...resBody, receiver: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Devir notu" value={resBody.note ?? ""} onChange={(e) => setResBody({ ...resBody, note: e.target.value })} />
            </>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="btn btn-ghost" onClick={() => setResolutionForm(null)}>Vazgeç</button>
            <button className="btn btn-primary" onClick={confirmResolve}><CheckCircle2 className="h-4 w-4" /> Onayla ve devam et</button>
          </div>
        </div>
      )}
    </div>
  );
}
