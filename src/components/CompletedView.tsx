import { useMock, type DraftEvidence } from "@/lib/mock";
import { type WorkType } from "@/lib/workflows";
import { EvidenceGrid } from "./EvidencePicker";
import { LinkedRecordsList } from "./LinkedRecordsList";
import { CheckCircle2, Mic, Clock, User } from "lucide-react";
import { formatDateTr } from "@/lib/toola";

type Work = {
  id: string; code: string; type: string; title: string;
  created_at: string; closed_at: string | null;
  work_performed: string | null; final_state: string | null;
  initial_state: string | null; root_cause: string | null; root_cause_status: string | null;
  follow_up_needed: boolean; follow_up_reason: string | null;
};

export function CompletedView({ w, type, technician, assignedBy }: {
  w: Work; type: WorkType;
  technician?: string; assignedBy?: string;
}) {
  const { getDraft } = useMock();
  const draft = getDraft(w.id);
  const tpl = (draft?.template ?? {}) as Record<string, any>;
  const evidence: DraftEvidence[] = draft?.evidence ?? [];
  const waitedFor = draft?.support?.waitingSince;

  return (
    <div className="space-y-3">
      <div className="card-soft p-4">
        <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-success" /><div className="text-sm text-muted-foreground">Tamamlandı</div></div>
        <div className="font-semibold">{formatDateTr(w.closed_at)}</div>
      </div>

      <div className="card-soft p-4">
        <div className="label mb-2">İş zaman çizelgesi</div>
        <ul className="text-sm space-y-2">
          {assignedBy && <Tl at="—" text={`Atayan: ${assignedBy}`} icon={User} />}
          <Tl at={formatDateTr(w.created_at)} text="Kayıt oluşturuldu" />
          {technician && <Tl at="—" text={`Teknisyen: ${technician}`} icon={User} />}
          {waitedFor && <Tl at={waitedFor} text="Destek/parça beklemesi" icon={Clock} />}
          <Tl at={formatDateTr(w.closed_at)} text="Kanıtlı kapatıldı" highlight />
        </ul>
      </div>

      {type === "ariza" && <FaultDetail w={w} tpl={tpl} />}
      {type === "bakim" && <MaintDetail draft={draft} tpl={tpl} />}
      {type === "test" && <TestDetail draft={draft} tpl={tpl} />}
      {type === "kurulum" && <InstallDetail draft={draft} tpl={tpl} />}
      {type === "parca" && <PartDetail tpl={tpl} />}
      {type === "diger" && <Card title="Özet" body={tpl.summary || w.work_performed} />}

      <div className="card-soft p-4">
        <div className="label mb-2">Kanıt galerisi</div>
        {evidence.length === 0 ? <div className="text-sm text-muted-foreground">Bu kayıt için kanıt eklenmemiş.</div> : <EvidenceGrid items={evidence} />}
      </div>

      <LinkedRecordsList workId={w.id} />

      {draft?.voiceTranscript && (
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2"><Mic className="h-4 w-4" /><div className="label">Sesli kapanış</div></div>
          <div className="text-sm whitespace-pre-wrap">{draft.voiceTranscript}</div>
        </div>
      )}

      <div className="card-soft p-4">
        <div className="label mb-1">Onay / revizyon</div>
        <div className="text-sm">v1 • {formatDateTr(w.closed_at)} • Teknisyen onayı ✓</div>
      </div>
    </div>
  );
}

function Tl({ at, text, highlight, icon: Icon }: { at: string; text: string; highlight?: boolean; icon?: any }) {
  return (
    <li className="flex items-start gap-2">
      {Icon ? <Icon className="h-3.5 w-3.5 mt-1 text-muted-foreground" /> : <div className={`h-2 w-2 rounded-full mt-1.5 ${highlight ? "bg-success" : "bg-border"}`} />}
      <div className="flex-1"><div>{text}</div><div className="text-[11px] text-muted-foreground">{at}</div></div>
    </li>
  );
}

function Card({ title, body, extra }: { title: string; body?: string | null; extra?: string }) {
  return <div className="card-soft p-4">
    <div className="flex items-center justify-between mb-1"><div className="label">{title}</div>{extra && <span className="pill capitalize">{extra}</span>}</div>
    <div className="text-sm whitespace-pre-wrap">{body || "—"}</div>
  </div>;
}

function FaultDetail({ w, tpl }: { w: Work; tpl: any }) {
  return (
    <>
      <Card title="Belirti / İlk durum" body={tpl.symptom || tpl.initial || w.initial_state} />
      <Card title="Kök neden" body={tpl.rootCause || w.root_cause} extra={tpl.rootCauseStatus || w.root_cause_status} />
      <Card title="Yapılan müdahale" body={tpl.intervention || w.work_performed} />
      <Card title="Parçalar" body={tpl.parts} />
      <Card title="Sonuç" body={tpl.result || w.final_state} />
      <Card title="Takip" body={tpl.followUp || (w.follow_up_needed ? w.follow_up_reason : "Yok")} />
    </>
  );
}

function MaintDetail({ draft, tpl }: { draft: any; tpl: any }) {
  return (
    <>
      <Card title="Bakım türü" body={tpl.maintType} />
      <Card title="İlk ölçümler" body={tpl.initialMeasurements} />
      <Card title="Yapılan işlemler" body={tpl.actions} />
      <Card title="Sarf / parça" body={tpl.consumables} />
      <Card title="Son ölçümler" body={tpl.finalMeasurements} />
      <Card title="Sonraki bakım" body={tpl.nextDate} />
      {(draft?.checklist ?? []).length > 0 && (
        <div className="card-soft p-4">
          <div className="label mb-2">Checklist</div>
          <ul className="text-sm space-y-1">
            {draft.checklist.map((c: any) => <li key={c.id} className="flex justify-between"><span>{c.label}</span><span className={`pill ${c.status === "uygun" ? "pill-success" : c.status === "sorun" ? "pill-danger" : ""}`}>{c.status ?? "—"}</span></li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function TestDetail({ draft, tpl }: { draft: any; tpl: any }) {
  return (
    <>
      <Card title="Test türü" body={tpl.testType} />
      <Card title="Koşullar" body={tpl.conditions} />
      <Card title="Cihaz" body={`${tpl.device ?? ""}${tpl.deviceSerial ? " • " + tpl.deviceSerial : ""}`} extra={tpl.calibStatus} />
      <Card title="Referans" body={`${tpl.refLow ?? "—"} - ${tpl.refHigh ?? "—"} ${tpl.refUnit ?? ""}`} />
      <Card title="Sonuç" body={tpl.verdict === "gecti" ? "Geçti" : tpl.verdict === "kaldi" ? "Kaldı" : tpl.verdict === "sinirda" ? "Sınırda" : "—"} />
      {(draft?.measurements ?? []).length > 0 && (
        <div className="card-soft p-4">
          <div className="label mb-2">Ölçümler</div>
          <ul className="text-sm space-y-1">
            {draft.measurements.map((m: any) => <li key={m.id} className="flex justify-between"><span>{m.value} {tpl.refUnit ?? ""}</span><span className={`pill ${m.verdict === "gecti" ? "pill-success" : m.verdict === "sinirda" ? "pill-warning" : "pill-danger"}`}>{m.verdict ?? "—"}</span></li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function InstallDetail({ draft, tpl }: { draft: any; tpl: any }) {
  return (
    <>
      <Card title="Ekipman" body={`${tpl.equipment ?? ""} ${tpl.model ?? ""} • ${tpl.serial ?? ""}`} />
      <Card title="Saha kontrolü" body={tpl.siteCheck} />
      <Card title="Mekanik / Elektrik / Yazılım" body={`Mekanik: ${tpl.mechDone ? "✓" : "—"}\nElektrik: ${tpl.elecDone ? "✓" : "—"}\nYazılım: ${tpl.swDone ? "✓" : tpl.swNotApplicable ? "N/A" : "—"}`} />
      <Card title="Devreye alma" body={tpl.commissioning} extra={tpl.commTestResult} />
      <Card title="Teslim" body={`${tpl.handover ?? "—"} • ${tpl.handoverDept ?? "—"} • ${tpl.handoverDate ?? "—"}`} extra={tpl.trainingDone ? "Eğitim ✓" : undefined} />
      <Card title="Durum" body={tpl.completionStatus} />
      {(draft?.punchList ?? []).length > 0 && (
        <div className="card-soft p-4">
          <div className="label mb-2">Punch list</div>
          {draft.punchList.map((p: any) => <div key={p.id} className="text-sm border-l-2 border-border pl-3 py-1"><div>{p.text}</div><div className="text-[11px] text-muted-foreground">{p.owner ?? "—"} • {p.due ?? "—"}</div></div>)}
        </div>
      )}
    </>
  );
}

function PartDetail({ tpl }: { tpl: any }) {
  return (
    <>
      <Card title="Değişim nedeni" body={tpl.reason} />
      <Card title="Sökülen parça" body={`${tpl.removed ?? "—"} ${tpl.removedCode ? "(" + tpl.removedCode + ")" : ""}\nSeri: ${tpl.removedSerial ?? "—"}\nDurum: ${tpl.removedCondition ?? "—"}`} />
      <Card title="Takılan parça" body={`${tpl.installed ?? "—"} ${tpl.installedCode ? "(" + tpl.installedCode + ")" : ""}\nSeri: ${tpl.installedSerial ?? "—"}\nAdet: ${tpl.qty ?? "—"}\nKaynak: ${tpl.source ?? "—"}`} />
      <Card title="Kurulum işlemleri" body={tpl.installActions} />
      <Card title="Fonksiyon testi" body={tpl.funcTest === "gecti" ? "Geçti" : tpl.funcTest === "kaldi" ? "Kaldı" : "—"} />
      <Card title="Eski parça akıbeti" body={tpl.disposition} />
    </>
  );
}
