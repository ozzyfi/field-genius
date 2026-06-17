import { useState } from "react";
import { MOCK_ASSIGNED_META } from "@/lib/mockData";
import { CheckCircle2, XCircle, Users, LifeBuoy, Paperclip, MessageCircle, FileText } from "lucide-react";
import { BottomSheet } from "./FocusSheet";
import { toast } from "sonner";

export function AssignedIntake({ workTitle, onAccept, onSupport }: { workTitle: string; onAccept: () => void; onSupport: () => void }) {
  const [decline, setDecline] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [info, setInfo] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);

  const m = MOCK_ASSIGNED_META;
  return (
    <div className="card-soft p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="pill pill-primary">Sana atandı</span>
        <span className="pill pill-warning">{m.priority}</span>
      </div>
      <div>
        <div className="font-semibold">{workTitle}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{m.assignedBy} • {m.team}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <KV label="Planlanan" value={m.plannedAt} />
        <KV label="Ekip" value={m.team} />
      </div>
      <div>
        <div className="label mb-1">Talep</div>
        <p className="text-sm">{m.request}</p>
      </div>
      {m.attachments.length > 0 && (
        <div>
          <div className="label mb-1">Ek belgeler</div>
          <div className="flex flex-wrap gap-2">
            {m.attachments.map((a) => <button key={a} onClick={() => setAttachment(a)} className="pill"><Paperclip className="h-3 w-3" />{a}</button>)}
          </div>
        </div>
      )}
      {m.relatedRecords.length > 0 && (
        <div>
          <div className="label mb-1">İlgili kayıtlar</div>
          {m.relatedRecords.map((r) => (
            <button key={r.code} onClick={() => setAttachment(r.code)} className="text-left text-[12px] border-l-2 border-border pl-3 py-1 w-full">
              <div className="font-semibold">{r.code} — {r.title}</div>
              <div className="text-muted-foreground">{r.date}</div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="btn btn-primary col-span-2" onClick={onAccept}><CheckCircle2 className="h-4 w-4" /> İşi kabul et ve başlat</button>
        <button className="btn btn-ghost" onClick={() => setInfo(true)}><MessageCircle className="h-4 w-4" /> Ek bilgi iste</button>
        <button className="btn btn-ghost" onClick={() => setDecline(true)}><XCircle className="h-4 w-4" /> Uygun değil</button>
        <button className="btn btn-ghost" onClick={() => setTransfer(true)}><Users className="h-4 w-4" /> Devret</button>
        <button className="btn btn-ghost" onClick={onSupport}><LifeBuoy className="h-4 w-4" /> Destek iste</button>
      </div>

      {info && (
        <BottomSheet title="Ek bilgi iste" onClose={() => setInfo(false)}>
          <textarea className="input mb-3" rows={4} placeholder="Atayan kişiden ne öğrenmen gerekiyor?" />
          <button className="btn btn-primary w-full" onClick={() => { setInfo(false); toast.success("Soru atayan kişiye iletildi"); }}>Gönder</button>
        </BottomSheet>
      )}
      {decline && (
        <BottomSheet title="İş uygun değil" onClose={() => setDecline(false)}>
          <div className="space-y-2 mb-3">
            {["Yetkim yok", "Ekipman erişimi yok", "Şu an müsait değilim", "Yanlış atama"].map((r) => (
              <button key={r} className="btn btn-ghost w-full justify-start" onClick={() => { setDecline(false); toast.success("Reddedildi — amir bilgilendirildi"); }}>{r}</button>
            ))}
          </div>
          <textarea className="input mb-3" rows={3} placeholder="Ek açıklama (opsiyonel)" />
          <button className="btn btn-danger w-full" onClick={() => { setDecline(false); toast.success("Reddedildi — amir bilgilendirildi"); }}>Reddi gönder</button>
        </BottomSheet>
      )}
      {transfer && (
        <BottomSheet title="Başka teknisyene devret" onClose={() => setTransfer(false)}>
          <div className="space-y-2 mb-3">
            {["Ali Y.", "Mehmet B.", "Ayşe K.", "Cem Ö."].map((n) => (
              <button key={n} className="card-soft w-full p-3 text-left tap" onClick={() => { setTransfer(false); toast.success(`${n} kişisine devredildi`); }}>
                <div className="font-semibold text-sm">{n}</div>
                <div className="text-[12px] text-muted-foreground">Mekanik Bakım • müsait</div>
              </button>
            ))}
          </div>
          <textarea className="input mb-2" rows={2} placeholder="Mevcut durum özeti" />
          <textarea className="input mb-2" rows={2} placeholder="Devir notu" />
          <input className="input" placeholder="Eklenecek kanıt" />
        </BottomSheet>
      )}
      {attachment && (
        <BottomSheet title={attachment} onClose={() => setAttachment(null)}>
          <div className="card-soft p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="text-sm text-muted-foreground">Bu, ekin/ilgili kaydın prototip önizlemesidir. Gerçek görüntüleyici entegrasyonu açıldığında belge burada görünecektir.</div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
function KV({ label, value }: { label: string; value: string }) { return <div><div className="label">{label}</div><div className="font-medium">{value}</div></div>; }
