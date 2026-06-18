import { useState } from "react";
import { MOCK_ASSIGNED_META } from "@/lib/mockData";
import { useMock } from "@/lib/mock";
import { CheckCircle2, XCircle, Users, LifeBuoy, Paperclip, MessageCircle, FileText, ArrowRight } from "lucide-react";
import { BottomSheet } from "./FocusSheet";
import { toast } from "sonner";

const DECLINE_REASONS = ["Yetkim yok", "Ekipman erişimi yok", "Şu an müsait değilim", "Yanlış atama"];
const TRANSFER_TARGETS = [
  { name: "Ali Y.", team: "Mekanik Bakım • müsait" },
  { name: "Mehmet B.", team: "Elektrik / PLC • müsait" },
  { name: "Ayşe K.", team: "Genel Bakım • meşgul" },
  { name: "Cem Ö.", team: "Mekanik Bakım • müsait" },
];

export function AssignedIntake({ workId, workTitle, onAccept, onSupport }: { workId: string; workTitle: string; onAccept: () => void; onSupport: () => void }) {
  const { updateDraft } = useMock();
  const [decline, setDecline] = useState<null | { step: 1 | 2 | 3 | 4; reason?: string; note: string; evidence: string[] }>(null);
  const [transfer, setTransfer] = useState<null | { step: 1 | 2 | 3 | 4 | 5; receiver?: string; state: string; note: string; evidence: string[]; next: string }>(null);
  const [info, setInfo] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);

  const m = MOCK_ASSIGNED_META;

  function confirmDecline() {
    if (!decline?.reason) return;
    updateDraft(workId, { decline: { reason: decline.reason, note: decline.note, evidence: decline.evidence, at: new Date().toISOString() }, workflowStatus: "iptal" });
    setDecline(null);
    toast.success("Red gönderildi — amir bilgilendirildi");
  }
  function confirmTransfer() {
    if (!transfer?.receiver) return;
    updateDraft(workId, { transfer: { receiver: transfer.receiver, state: transfer.state, note: transfer.note, evidence: transfer.evidence, nextStep: transfer.next, at: new Date().toISOString() }, workflowStatus: "iptal" });
    setTransfer(null);
    toast.success(`${transfer.receiver} kişisine devredildi`);
  }

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
        <button className="btn btn-ghost" onClick={() => setDecline({ step: 1, note: "", evidence: [] })}><XCircle className="h-4 w-4" /> Uygun değil</button>
        <button className="btn btn-ghost" onClick={() => setTransfer({ step: 1, state: "", note: "", evidence: [], next: "" })}><Users className="h-4 w-4" /> Devret</button>
        <button className="btn btn-ghost" onClick={onSupport}><LifeBuoy className="h-4 w-4" /> Destek iste</button>
      </div>

      {info && (
        <BottomSheet title="Ek bilgi iste" onClose={() => setInfo(false)}>
          <textarea className="input mb-3" rows={4} placeholder="Atayan kişiden ne öğrenmen gerekiyor?" />
          <button className="btn btn-primary w-full" onClick={() => { setInfo(false); toast.success("Soru atayan kişiye iletildi"); }}>Gönder</button>
        </BottomSheet>
      )}

      {decline && (
        <BottomSheet title={`Reddi gönder (${decline.step}/4)`} onClose={() => setDecline(null)}>
          {decline.step === 1 && (
            <>
              <div className="label mb-2">Red nedeni</div>
              <div className="space-y-2 mb-3">
                {DECLINE_REASONS.map((r) => (
                  <button key={r} className={`btn w-full justify-start ${decline.reason === r ? "btn-ink" : "btn-ghost"}`} onClick={() => setDecline({ ...decline, reason: r })}>{r}</button>
                ))}
              </div>
              <button className="btn btn-primary w-full" disabled={!decline.reason} onClick={() => setDecline({ ...decline, step: 2 })}>Sonraki <ArrowRight className="h-4 w-4" /></button>
            </>
          )}
          {decline.step === 2 && (
            <>
              <div className="label mb-2">Açıklama</div>
              <textarea className="input mb-3" rows={4} placeholder="Atayan kişiye iletilecek detay" value={decline.note} onChange={(e) => setDecline({ ...decline, note: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setDecline({ ...decline, step: 1 })}>Geri</button>
                <button className="btn btn-primary" onClick={() => setDecline({ ...decline, step: 3 })}>Sonraki</button>
              </div>
            </>
          )}
          {decline.step === 3 && (
            <>
              <div className="label mb-2">Kanıt (opsiyonel)</div>
              <button className="btn btn-ghost w-full mb-2" onClick={() => setDecline({ ...decline, evidence: [...decline.evidence, `kanıt-${decline.evidence.length + 1}`] })}>Fotoğraf ekle</button>
              {decline.evidence.length > 0 && <div className="text-sm mb-3">{decline.evidence.length} kanıt eklendi</div>}
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setDecline({ ...decline, step: 2 })}>Geri</button>
                <button className="btn btn-primary" onClick={() => setDecline({ ...decline, step: 4 })}>Sonraki</button>
              </div>
            </>
          )}
          {decline.step === 4 && (
            <>
              <div className="card-soft p-3 mb-3 text-sm">
                <div><span className="text-muted-foreground">Neden:</span> {decline.reason}</div>
                <div className="mt-1"><span className="text-muted-foreground">Açıklama:</span> {decline.note || "—"}</div>
                <div className="mt-1"><span className="text-muted-foreground">Kanıt:</span> {decline.evidence.length}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setDecline({ ...decline, step: 3 })}>Geri</button>
                <button className="btn btn-danger" onClick={confirmDecline}>Reddi onayla</button>
              </div>
            </>
          )}
        </BottomSheet>
      )}

      {transfer && (
        <BottomSheet title={`Devret (${transfer.step}/5)`} onClose={() => setTransfer(null)}>
          {transfer.step === 1 && (
            <>
              <div className="label mb-2">Teknisyen</div>
              <div className="space-y-2 mb-3">
                {TRANSFER_TARGETS.map((n) => (
                  <button key={n.name} className={`card-soft w-full p-3 text-left tap ${transfer.receiver === n.name ? "ring-2 ring-primary" : ""}`} onClick={() => setTransfer({ ...transfer, receiver: n.name })}>
                    <div className="font-semibold text-sm">{n.name}</div>
                    <div className="text-[12px] text-muted-foreground">{n.team}</div>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary w-full" disabled={!transfer.receiver} onClick={() => setTransfer({ ...transfer, step: 2 })}>Sonraki</button>
            </>
          )}
          {transfer.step === 2 && (
            <>
              <div className="label mb-2">Mevcut durum özeti</div>
              <textarea className="input mb-3" rows={4} value={transfer.state} onChange={(e) => setTransfer({ ...transfer, state: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setTransfer({ ...transfer, step: 1 })}>Geri</button>
                <button className="btn btn-primary" onClick={() => setTransfer({ ...transfer, step: 3 })}>Sonraki</button>
              </div>
            </>
          )}
          {transfer.step === 3 && (
            <>
              <div className="label mb-2">Devir notu</div>
              <textarea className="input mb-3" rows={4} value={transfer.note} onChange={(e) => setTransfer({ ...transfer, note: e.target.value })} />
              <button className="btn btn-ghost w-full mb-3" onClick={() => setTransfer({ ...transfer, evidence: [...transfer.evidence, `kanıt-${transfer.evidence.length + 1}`] })}>
                Kanıt ekle ({transfer.evidence.length})
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setTransfer({ ...transfer, step: 2 })}>Geri</button>
                <button className="btn btn-primary" onClick={() => setTransfer({ ...transfer, step: 4 })}>Sonraki</button>
              </div>
            </>
          )}
          {transfer.step === 4 && (
            <>
              <div className="label mb-2">Önerilen sonraki adım</div>
              <textarea className="input mb-3" rows={3} value={transfer.next} onChange={(e) => setTransfer({ ...transfer, next: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setTransfer({ ...transfer, step: 3 })}>Geri</button>
                <button className="btn btn-primary" onClick={() => setTransfer({ ...transfer, step: 5 })}>Sonraki</button>
              </div>
            </>
          )}
          {transfer.step === 5 && (
            <>
              <div className="card-soft p-3 mb-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Devralan:</span> {transfer.receiver}</div>
                <div><span className="text-muted-foreground">Durum:</span> {transfer.state || "—"}</div>
                <div><span className="text-muted-foreground">Not:</span> {transfer.note || "—"}</div>
                <div><span className="text-muted-foreground">Sonraki adım:</span> {transfer.next || "—"}</div>
                <div><span className="text-muted-foreground">Kanıt:</span> {transfer.evidence.length}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={() => setTransfer({ ...transfer, step: 4 })}>Geri</button>
                <button className="btn btn-primary" onClick={confirmTransfer}>Devri onayla</button>
              </div>
            </>
          )}
        </BottomSheet>
      )}

      {attachment && (
        <BottomSheet title={attachment} onClose={() => setAttachment(null)}>
          <div className="card-soft p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="text-sm text-muted-foreground">Bu, ekin/ilgili kaydın prototip önizlemesidir.</div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) { return <div><div className="label">{label}</div><div className="font-medium">{value}</div></div>; }
