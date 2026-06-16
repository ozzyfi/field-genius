import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Sparkles, History, Wrench, Search, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { MOCK_SIMILAR_CASES, MOCK_DOCS } from "@/lib/mockData";
import { MachinePicker } from "@/components/Pickers";
import { useMock } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ai")({
  ssr: false,
  component: AiPage,
});

function AiPage() {
  const navigate = useNavigate();
  const { drafts } = useMock();
  const [view, setView] = useState<"home" | "similar" | "docs">("home");
  const [machinePicker, setMachinePicker] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<null | { found: boolean; text?: string; source?: { doc: string; section: string }; steps?: string[] }>(null);

  function continueActive() {
    const arr = Object.values(drafts).sort((a, b) => b.lastSavedAt - a.lastSavedAt);
    if (arr.length === 0) {
      toast("Aktif iş bulunamadı. İşlerim sekmesinden bir kayıt aç.");
      navigate({ to: "/islerim" });
      return;
    }
    navigate({ to: "/is/$id", params: { id: arr[0].workId } });
  }

  function ask() {
    if (!question.trim()) return;
    const known = /kaplin|titreşim|hizala/i.test(question);
    if (known) {
      setAnswer({
        found: true,
        text: "Yüksek titreşim ve ses birlikte görüldüğünde önce kaplin hizasını kontrol edin. Ardından kayış gerginliğini ölçün.",
        source: { doc: "Bakım Kılavuzu", section: "s.42 — Kaplin hizalama" },
        steps: ["Makineyi etiketleyip kilitleyin", "Kaplin yüzeylerini temizleyin", "Lazer hizalayıcı ile ölçüm yapın", "Cıvataları tork değerinde sıkın"],
      });
    } else {
      setAnswer({ found: false });
    }
  }

  if (view === "similar") return (
    <Screen title="Benzer vakalar" back={() => setView("home")}>
      <div className="space-y-3">
        {MOCK_SIMILAR_CASES.map((c) => (
          <div key={c.id} className="card-soft p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="pill pill-ink">{c.code}</span>
              <span className="pill pill-success">%{Math.round(c.similarity * 100)} benzer</span>
              {c.sameMachine && <span className="pill">Aynı makine</span>}
            </div>
            <div className="font-semibold">{c.symptom}</div>
            <div className="text-[13px] text-muted-foreground mt-1">{c.machine} • {c.date}</div>
            <div className="mt-2 text-sm space-y-1">
              <div><span className="text-muted-foreground">Kök neden:</span> {c.rootCause}</div>
              <div><span className="text-muted-foreground">Müdahale:</span> {c.intervention}</div>
              {c.parts.length > 0 && <div><span className="text-muted-foreground">Parça:</span> {c.parts.join(", ")}</div>}
              <div><span className="text-muted-foreground">Sonuç:</span> {c.result}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button className="btn btn-ghost text-xs" onClick={() => toast("Detay görünümü açıldı (demo)")}>Detayı aç</button>
              <button className="btn btn-ghost text-xs" onClick={() => toast("Mevcut işe bağlandı")}>Mevcut işe bağla</button>
              <button className="btn btn-primary text-xs" onClick={() => toast("Müdahale önerisi taslağa eklendi")}>Öneri olarak kullan</button>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );

  if (view === "docs") return (
    <Screen title="Teknik dokümana sor" back={() => { setView("home"); setAnswer(null); }}>
      <div className="card-soft p-4 mb-3">
        <textarea className="input mb-2" rows={3} placeholder="Örn. Kaplin hizalama nasıl yapılır?" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="btn btn-primary w-full" onClick={ask} disabled={!question.trim()}>Sor</button>
      </div>

      {answer && (
        answer.found ? (
          <div className="card-soft p-4 space-y-3">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><div className="label">Cevap</div></div>
            <div className="text-sm">{answer.text}</div>
            <div>
              <div className="label mb-1">Önerilen adımlar</div>
              <ol className="text-sm list-decimal ml-5 space-y-1">{answer.steps!.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
            <div className="rounded-2xl border border-border p-3 text-sm">
              <div className="label mb-1">Kaynak</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><div>{answer.source!.doc} — {answer.source!.section}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={() => toast("Kaynak görüntüleyici (demo)")}>Kaynağı aç</button>
              <button className="btn btn-primary" onClick={() => toast("İş adımı olarak eklendi")}>Adım olarak ekle</button>
            </div>
          </div>
        ) : (
          <div className="card-soft p-5 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-warning mb-2" />
            <div className="font-semibold">Onaylı kaynaklarda yeterli bilgi bulunamadı.</div>
            <div className="text-sm text-muted-foreground mt-1">ToolA, kaynak göstermeden cevap üretmez. Uzman desteği isteyebilirsin.</div>
          </div>
        )
      )}

      <div className="mt-4">
        <div className="section-title mb-2">Onaylı belgeler</div>
        <div className="space-y-2">
          {MOCK_DOCS.map((d) => (
            <div key={d.id} className="card-soft p-3 flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><div className="font-semibold text-sm">{d.title}</div><div className="text-[12px] text-muted-foreground">{d.section}</div></div></div>
          ))}
        </div>
      </div>
    </Screen>
  );

  return (
    <Screen title="ToolA AI">
      <div className="card-soft p-5 mb-4 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <Sparkles className="h-6 w-6 text-primary mb-3" />
        <h1 className="text-xl font-bold tracking-tight">Sahada karar vermek için yanındayım</h1>
        <p className="text-sm opacity-80 mt-1">Aktif işine devam edebilir, makine geçmişine ya da benzer vakalara sorabilirsin. Yalnız onaylı verilerle konuşurum.</p>
      </div>

      <div className="section-title mb-2">Bağlam seç</div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={continueActive} className="card-soft p-4 text-left tap"><History className="h-5 w-5 mb-2" /><div className="font-semibold text-sm">Aktif işime devam et</div></button>
        <button onClick={() => setMachinePicker(true)} className="card-soft p-4 text-left tap"><Wrench className="h-5 w-5 mb-2" /><div className="font-semibold text-sm">Makine seç</div></button>
        <button onClick={() => setView("similar")} className="card-soft p-4 text-left tap"><Search className="h-5 w-5 mb-2" /><div className="font-semibold text-sm">Benzer vaka ara</div></button>
        <button onClick={() => setView("docs")} className="card-soft p-4 text-left tap"><FileText className="h-5 w-5 mb-2" /><div className="font-semibold text-sm">Teknik dokümana sor</div></button>
      </div>

      {machinePicker && (
        <MachinePicker
          onClose={() => setMachinePicker(false)}
          onPick={(m) => { setMachinePicker(false); toast(`${m.name} bağlamı seçildi`); setView("similar"); }}
        />
      )}
    </Screen>
  );
}
