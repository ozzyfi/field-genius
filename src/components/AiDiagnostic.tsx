import { useState } from "react";
import { useMock, type DraftEvidence } from "@/lib/mock";
import { MOCK_DIAGNOSTIC_STEPS, MOCK_SIMILAR_CASES } from "@/lib/mockData";
import { Sparkles, FileText, AlertTriangle, CheckCircle2, HelpCircle, Camera, Gauge, ExternalLink, ArrowRight } from "lucide-react";
import { BottomSheet } from "./FocusSheet";
import { EvidencePicker } from "./EvidencePicker";

export function AiDiagnostic({ workId, symptom, onBack, onProceed }: {
  workId: string; symptom?: string; onBack: () => void; onProceed: () => void;
}) {
  const { getDraft, updateDraft } = useMock();
  const draft = getDraft(workId);
  const checks = draft?.diagnosticChecks ?? [];
  const [idx, setIdx] = useState(checks.length);
  const [source, setSource] = useState<null | { doc: string; section: string }>(null);
  const [picker, setPicker] = useState<null | { side: "once" | "sirasinda" | "sonra"; kindHint?: "olcum" | "foto" }>(null);
  const total = MOCK_DIAGNOSTIC_STEPS.length;
  const step = idx < total ? MOCK_DIAGNOSTIC_STEPS[idx] : null;
  const done = idx >= total || checks.some((c) => c.result === "sorun");

  function recordResult(result: "normal" | "sorun" | "emin_degil") {
    const newCheck = { id: step!.id, title: step!.title, result, at: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) };
    const next = [...checks, newCheck];
    updateDraft(workId, { diagnosticChecks: next });
    if (result === "sorun") {
      updateDraft(workId, { identifiedCause: step!.title });
      setIdx(total);
    } else {
      setIdx(idx + 1);
    }
  }

  function addEv(e: DraftEvidence) {
    updateDraft(workId, { evidence: [...(draft?.evidence ?? []), { ...e, stepId: `ai-${step?.id}` }] });
  }

  return (
    <div className="space-y-3">
      <div className="card-soft p-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary" /><div className="text-[11px] uppercase tracking-widest opacity-70">Mevcut belirti</div></div>
        <div className="font-semibold">{symptom ?? "Yüksek titreşim ve ses — Konveyör Bandı 7"}</div>
        <div className="text-[12px] opacity-80 mt-1">Operatör fire artışı bildirdi. Adım adım kontrolle ilerleyeceğiz.</div>
      </div>

      {checks.length > 0 && !done && (
        <div className="card-soft p-3">
          <div className="label mb-1">Tamamlanan kontroller</div>
          <ul className="text-sm space-y-1">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {c.result === "normal" ? <CheckCircle2 className="h-4 w-4 text-success" /> : c.result === "sorun" ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <HelpCircle className="h-4 w-4 text-muted-foreground" />}
                <span className="flex-1">{c.title}</span>
                <span className="text-[11px] text-muted-foreground">{c.at}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step && !done ? (
        <div className="card-soft p-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Önerilen kontrol {idx + 1}/{total}</div>
          <div className="font-bold text-lg leading-snug">{step.title}</div>
          <p className="text-sm text-muted-foreground mt-1">{step.reason}</p>

          {step.safety && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-[13px]">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[oklch(0.40_0.10_70)]" />
              <div><strong>Güvenlik:</strong> {step.safety}</div>
            </div>
          )}

          <div className="mt-3">
            <div className="label mb-1">Kaynaklar</div>
            <div className="flex flex-wrap gap-2">
              {step.sources.map((s) => (
                <button key={s.doc + s.section} onClick={() => setSource(s)} className="pill"><FileText className="h-3 w-3" />{s.doc} — {s.section}</button>
              ))}
              <span className="pill pill-success">Güven %{Math.round(step.confidence * 100)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn btn-ghost" onClick={() => setPicker({ side: "sirasinda", kindHint: "foto" })}><Camera className="h-4 w-4" /> Kanıt ekle</button>
            <button className="btn btn-ghost" onClick={() => setPicker({ side: "sirasinda", kindHint: "olcum" })}><Gauge className="h-4 w-4" /> Ölçüm gir</button>
          </div>
          <div className="text-[12px] text-muted-foreground mt-3 mb-1">Kontrolü yaptıktan sonra:</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => recordResult("normal")} className="btn btn-ghost text-success"><CheckCircle2 className="h-4 w-4" /> Normal</button>
            <button onClick={() => recordResult("sorun")} className="btn btn-ghost text-destructive"><AlertTriangle className="h-4 w-4" /> Sorun</button>
            <button onClick={() => recordResult("emin_degil")} className="btn btn-ghost"><HelpCircle className="h-4 w-4" /> Emin değilim</button>
          </div>
        </div>
      ) : (
        <div className="card-soft p-4">
          <div className="font-semibold mb-2">Teşhis tamamlandı</div>
          {draft?.identifiedCause && (
            <div className="rounded-2xl border border-border p-3 mb-3">
              <div className="label mb-1">Tespit edilen kök neden</div>
              <div className="font-semibold">{draft.identifiedCause}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">ToolA önerisi: müdahaleye geç ve kapanışı doldur.</div>
            </div>
          )}
          <ul className="text-sm space-y-1 mb-3">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {c.result === "normal" ? <CheckCircle2 className="h-4 w-4 text-success" /> : c.result === "sorun" ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <HelpCircle className="h-4 w-4 text-muted-foreground" />}
                <span>{c.title}</span>
              </li>
            ))}
          </ul>
          <button onClick={onProceed} className="btn btn-primary w-full">Müdahale ve kapanışa geç <ArrowRight className="h-4 w-4" /></button>
        </div>
      )}

      <SimilarCases />

      <button onClick={onBack} className="btn btn-ghost w-full">Geri</button>

      {source && (
        <BottomSheet title={source.doc} onClose={() => setSource(null)}>
          <div className="text-sm text-muted-foreground mb-2">{source.section}</div>
          <div className="card-soft p-4 text-sm">
            <p>Bu, kaynak belge önizlemesinin prototip görünümüdür. Gerçek belge görüntüleyici entegrasyonu açıldığında ilgili sayfa burada gösterilecektir.</p>
          </div>
          <button className="btn btn-ghost w-full mt-3"><ExternalLink className="h-4 w-4" /> Kaynağı tam ekran aç</button>
        </BottomSheet>
      )}

      {picker && <EvidencePicker onAdd={(e) => addEv({ ...e, side: picker.side })} onClose={() => setPicker(null)} />}
    </div>
  );
}

function SimilarCases() {
  return (
    <div className="card-soft p-4">
      <div className="font-semibold mb-2">Benzer onaylı vakalar</div>
      <div className="space-y-2">
        {MOCK_SIMILAR_CASES.slice(0, 2).map((c) => (
          <div key={c.id} className="rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="pill pill-ink">{c.code}</span>
              <span className="pill pill-success">%{Math.round(c.similarity * 100)} benzer</span>
              {c.sameMachine && <span className="pill">Aynı makine</span>}
            </div>
            <div className="text-sm font-medium">{c.rootCause}</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{c.intervention} • {c.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
