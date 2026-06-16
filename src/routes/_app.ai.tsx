import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Sparkles, History, Wrench, Search } from "lucide-react";

export const Route = createFileRoute("/_app/ai")({
  ssr: false,
  component: AiPage,
});

function AiPage() {
  return (
    <Screen title="ToolA AI">
      <div className="card-soft p-5 mb-4 bg-ink text-ink-foreground border-transparent">
        <Sparkles className="h-6 w-6 text-primary mb-3" />
        <h1 className="text-xl font-bold tracking-tight">Sahada karar vermek için yanındayım</h1>
        <p className="text-sm opacity-80 mt-1">
          Aktif işine devam edebilir, makine geçmişine ya da benzer vakalara sorabilirsin. Yalnız onaylı verilerle konuşurum.
        </p>
      </div>

      <div className="section-title mb-2">Bağlam seç</div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: History, label: "Aktif işime devam et" },
          { icon: Wrench, label: "Makine seç" },
          { icon: Search, label: "Benzer vaka ara" },
          { icon: Sparkles, label: "Teknik dokümana sor" },
        ].map((q) => (
          <button key={q.label} className="card-soft p-4 text-left tap">
            <q.icon className="h-5 w-5 mb-2" />
            <div className="font-semibold text-sm">{q.label}</div>
          </button>
        ))}
      </div>

      <div className="card-soft p-4">
        <div className="text-sm text-muted-foreground mb-2">Hızlı soru</div>
        <textarea className="input mb-3" placeholder="Örn. Bu titreşim seviyesi normal mi?" />
        <button className="btn btn-primary w-full" disabled>
          Demo: AI entegrasyonu kuruldu, model bağlantısı henüz aktif değil
        </button>
      </div>
    </Screen>
  );
}
