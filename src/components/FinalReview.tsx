import { useMock } from "@/lib/mock";
import { missingForReview, WORKFLOWS, type WorkType } from "@/lib/workflows";
import { EvidenceGrid } from "./EvidencePicker";
import { LinkedRecordsList } from "./LinkedRecordsList";
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
  const missing = missingForReview(d);
  const ok = missing.length === 0;

  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-success" /><div className="font-semibold">Kapanış öncesi son kontrol</div></div>
        {ok ? (
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
        <Row label="İş türü" value={WORKFLOWS[type] ? type : type} />
      </div>

      {type === "ariza" && <FaultSummary d={d} />}
      {type === "bakim" && <MaintenanceSummary d={d} />}
      {type === "test" && <TestSummary d={d} />}
      {type === "kurulum" && <InstallationSummary d={d} />}
      {type === "parca" && <PartSummary d={d} />}
      {type === "diger" && <Block title="Özet" body={tpl.summary} />}

      <div className="card-soft p-4">
        <div className="label mb-2">Kanıt galerisi</div>
        <EvidenceGrid items={d.evidence} />
      </div>

      <LinkedRecordsList workId={workId} />

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

function Row({ label, value }: { label: string; value?: string }) {
  return <div className="flex justify-between gap-3 py-1 text-sm border-b border-border last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right max-w-[60%] truncate">{value || "—"}</span>
  </div>;
}
function Block({ title, body }: { title: string; body?: string }) {
  return <div className="card-soft p-4">
    <div className="label mb-1">{title}</div>
    <div className="text-sm whitespace-pre-wrap">{body || "—"}</div>
  </div>;
}

function FaultSummary({ d }: { d: any }) {
  const tpl = d.template ?? {};
  return (
    <div className="card-soft p-4 space-y-0">
      <div className="label mb-2">Arıza özeti</div>
      <Row label="Belirti" value={tpl.symptom} />
      <Row label="İlk durum" value={tpl.initial} />
      <Row label="Kök neden" value={tpl.rootCause} />
      <Row label="Güven" value={tpl.rootCauseStatus} />
      <Row label="Müdahale" value={tpl.intervention || d.intervention} />
      <Row label="Parçalar" value={tpl.parts} />
      <Row label="Sonuç" value={tpl.result} />
      <Row label="Takip" value={tpl.followUp} />
    </div>
  );
}

function MaintenanceSummary({ d }: { d: any }) {
  const tpl = d.template ?? {};
  const cl = (d.checklist ?? []) as { label: string; status?: string; note?: string }[];
  return (
    <div className="card-soft p-4 space-y-0">
      <div className="label mb-2">Bakım özeti</div>
      <Row label="Bakım türü" value={tpl.maintType} />
      <Row label="Prosedür okundu" value={tpl.procRead ? "Evet" : "Hayır"} />
      <Row label="İlk ölçüm" value={tpl.initialMeasurements} />
      <Row label="Yapılan işlemler" value={tpl.actions} />
      <Row label="Sarf / parça" value={tpl.consumables} />
      <Row label="Son ölçüm" value={tpl.finalMeasurements} />
      <Row label="Sonraki bakım" value={tpl.nextDate} />
      {cl.length > 0 && (
        <div className="mt-3">
          <div className="label mb-1">Checklist sonuçları</div>
          <ul className="text-sm space-y-1">
            {cl.map((c) => <li key={c.label} className="flex justify-between gap-2"><span>{c.label}</span><span className={`pill ${c.status === "uygun" ? "pill-success" : c.status === "sorun" ? "pill-danger" : ""}`}>{c.status ?? "—"}</span></li>)}
          </ul>
        </div>
      )}
      {(d.findings ?? []).length > 0 && (
        <div className="mt-3">
          <div className="label mb-1">Yeni bulgular</div>
          {(d.findings as any[]).map((f) => <div key={f.id} className="text-sm border-l-2 border-border pl-3 py-1"><div>{f.text}</div><div className="text-[11px] text-muted-foreground">Aksiyon: {f.action ?? "—"}</div></div>)}
        </div>
      )}
    </div>
  );
}

function TestSummary({ d }: { d: any }) {
  const tpl = d.template ?? {};
  const ms = (d.measurements ?? []) as any[];
  return (
    <div className="card-soft p-4 space-y-0">
      <div className="label mb-2">Test özeti</div>
      <Row label="Test türü" value={tpl.testType} />
      <Row label="Koşullar" value={tpl.conditions} />
      <Row label="Cihaz" value={`${tpl.device ?? ""} ${tpl.deviceSerial ? "• " + tpl.deviceSerial : ""}`} />
      <Row label="Kalibrasyon" value={tpl.calibStatus} />
      <Row label="Referans aralığı" value={`${tpl.refLow ?? ""} - ${tpl.refHigh ?? ""} ${tpl.refUnit ?? ""}`} />
      <Row label="Sonuç" value={tpl.verdict === "gecti" ? "Geçti" : tpl.verdict === "kaldi" ? "Kaldı" : tpl.verdict === "sinirda" ? "Sınırda" : "—"} />
      <Row label="Tekrar test" value={tpl.retestDecision} />
      {ms.length > 0 && (
        <div className="mt-3">
          <div className="label mb-1">Ölçümler</div>
          <ul className="text-sm space-y-1">
            {ms.map((m) => <li key={m.id} className="flex justify-between"><span>{m.value} {tpl.refUnit ?? ""}</span><span className={`pill ${m.verdict === "gecti" ? "pill-success" : m.verdict === "sinirda" ? "pill-warning" : m.verdict === "kaldi" ? "pill-danger" : ""}`}>{m.verdict ?? "—"}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function InstallationSummary({ d }: { d: any }) {
  const tpl = d.template ?? {};
  const pl = (d.punchList ?? []) as any[];
  return (
    <div className="card-soft p-4 space-y-0">
      <div className="label mb-2">Kurulum özeti</div>
      <Row label="Ekipman" value={`${tpl.equipment ?? ""} ${tpl.model ?? ""}`} />
      <Row label="Seri" value={tpl.serial} />
      <Row label="Lokasyon" value={tpl.instLocation} />
      <Row label="Saha kontrolü" value={tpl.siteCheck} />
      <Row label="Mekanik montaj" value={tpl.mechDone ? "Tamam" : "—"} />
      <Row label="Elektrik / kontrol" value={tpl.elecDone ? "Tamam" : "—"} />
      <Row label="Yazılım / parametre" value={tpl.swDone ? "Tamam" : tpl.swNotApplicable ? "Uygulanamaz" : "—"} />
      <Row label="Devreye alma" value={tpl.commissioning} />
      <Row label="Test sonucu" value={tpl.commTestResult === "gecti" ? "Geçti" : tpl.commTestResult === "kaldi" ? "Kaldı" : "—"} />
      <Row label="Teslim" value={`${tpl.handover ?? ""} • ${tpl.handoverDept ?? ""}`} />
      <Row label="Eğitim" value={tpl.trainingDone ? "Tamam" : "—"} />
      <Row label="Durum" value={tpl.completionStatus} />
      {pl.length > 0 && (
        <div className="mt-3">
          <div className="label mb-1">Punch list ({pl.length})</div>
          {pl.map((p) => <div key={p.id} className="text-sm border-l-2 border-border pl-3 py-1"><div>{p.text}</div><div className="text-[11px] text-muted-foreground">{p.owner ?? "—"} • {p.due ?? "—"}</div></div>)}
        </div>
      )}
    </div>
  );
}

function PartSummary({ d }: { d: any }) {
  const tpl = d.template ?? {};
  return (
    <div className="card-soft p-4 space-y-0">
      <div className="label mb-2">Parça değişimi özeti</div>
      <Row label="Neden" value={tpl.reason} />
      <Row label="Sökülen" value={`${tpl.removed ?? ""} ${tpl.removedCode ? "(" + tpl.removedCode + ")" : ""}`} />
      <Row label="Sökülen seri" value={tpl.removedSerial} />
      <Row label="Sökülen durumu" value={tpl.removedCondition} />
      <Row label="Takılan" value={`${tpl.installed ?? ""} ${tpl.installedCode ? "(" + tpl.installedCode + ")" : ""}`} />
      <Row label="Takılan seri" value={tpl.installedSerial} />
      <Row label="Adet / Kaynak" value={`${tpl.qty ?? "—"} / ${tpl.source ?? "—"}`} />
      <Row label="Kurulum işlemleri" value={tpl.installActions} />
      <Row label="Fonksiyon testi" value={tpl.funcTest === "gecti" ? "Geçti" : tpl.funcTest === "kaldi" ? "Kaldı" : "—"} />
      <Row label="Eski parça akıbeti" value={tpl.disposition} />
    </div>
  );
}
