import { useMock } from "@/lib/mock";
import { templateMissing, type WorkType } from "./CompletionTemplates";
import { EvidenceGrid } from "./EvidencePicker";
import { AlertTriangle, ShieldCheck, Mic } from "lucide-react";

export function FinalReview({ workId, type, machine, location, onClose, onConfirm }: {
  workId: string; type: WorkType;
  machine: string; location: string;
  onClose: () => void; onConfirm: () => void;
}) {
  const { getDraft } = useMock();
  const d = getDraft(workId);
  if (!d) return null;
  const tpl = (d.template ?? {}) as Record<string, any>;
  const missing = templateMissing(type, tpl);
  const requiresAfter = type === "ariza" || type === "parca";
  if (requiresAfter && !d.evidence.some((e) => e.side === "sonra")) missing.push("Son durum kanıtı");
  if (!d.voiceTranscript?.trim()) missing.push("Sesli kapanış");

  const ok = missing.length === 0;

  function Row({ label, value }: { label: string; value?: string }) {
    return <div className="flex justify-between gap-3 py-1 text-sm border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>;
  }

  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-success" /><div className="font-semibold">Kapanış öncesi son kontrol</div></div>
        {missing.length === 0 ? (
          <div className="pill pill-success">Tüm zorunlu bilgiler tamam</div>
        ) : (
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-[13px]">
            <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle className="h-4 w-4" />{missing.length} zorunlu bilgi eksik</div>
            <ul className="list-disc ml-5">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
      </div>

      <div className="card-soft p-4">
        <Row label="Makine" value={machine} />
        <Row label="Lokasyon" value={location} />
        <Row label="İş türü" value={type} />
        <Row label="Belirti / ihtiyaç" value={tpl.symptom} />
        <Row label="İlk durum" value={tpl.initial} />
        <Row label="Kök neden" value={tpl.rootCause} />
        <Row label="Kök neden güveni" value={tpl.rootCauseStatus} />
        <Row label="Müdahale" value={tpl.intervention || d.intervention} />
        <Row label="Parçalar" value={tpl.parts} />
        <Row label="Ölçümler" value={tpl.measurements} />
        <Row label="Sonuç" value={tpl.result} />
        <Row label="Takip" value={tpl.followUp} />
      </div>

      <div className="card-soft p-4">
        <div className="label mb-2">Kanıt galerisi</div>
        <EvidenceGrid items={d.evidence} />
      </div>

      {d.voiceTranscript && (
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-1"><Mic className="h-4 w-4" /><div className="label">Sesli kapanış dökümü</div></div>
          <div className="text-sm whitespace-pre-wrap">{d.voiceTranscript}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Geri dön</button>
        <button className="btn btn-primary" disabled={!ok} onClick={onConfirm}>Kontrol ettim, kanıtlı kapat</button>
      </div>
    </div>
  );
}
