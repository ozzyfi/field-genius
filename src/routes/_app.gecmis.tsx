import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Screen } from "@/components/AppShell";
import { WorkCard, type WorkRow } from "@/components/WorkCard";
import { MOCK_HISTORY_INSIGHT } from "@/lib/mockData";
import { Sparkles, TrendingUp, History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/_app/gecmis")({
  ssr: false,
  component: GecmisPage,
});

function GecmisPage() {
  const { profile } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["gecmis", profile?.org_id],
    enabled: !!profile?.org_id,
    queryFn: async (): Promise<WorkRow[]> => {
      const { data, error } = await supabase
        .from("work_records")
        .select("id, code, type, status, priority, source, title, description, location_note, created_at, machine:machines(name, location)")
        .eq("status", "tamamlandi")
        .order("closed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WorkRow[];
    },
  });

  const i = MOCK_HISTORY_INSIGHT;
  return (
    <Screen title="Geçmiş">
      <h1 className="text-2xl font-bold tracking-tight mb-3">Makine geçmişi</h1>

      <div className="card-soft p-4 mb-3 bg-ink text-ink-foreground border-transparent" style={{ background: "var(--color-ink)", color: "var(--color-ink-foreground)" }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary" /><div className="text-[11px] uppercase tracking-widest opacity-70">Karar desteği — Konveyör Bandı 7</div></div>
        <div className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Tekrarlayan konu</div>
        <p className="text-sm opacity-90 mt-1">{i.insight}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-[12px]">
        <Stat label="Açık iş" value={String(i.openCount)} />
        <Stat label="Son 90 gün kayıt" value={String(i.records90d)} />
        <Stat label="Son arıza" value={i.lastFailure} />
        <Stat label="Son bakım" value={i.lastMaintenance} />
        <Stat label="Tekrarlayan belirti" value={i.recurringSymptom} />
        <Stat label="En sık kök neden" value={i.topRootCause} />
        <Stat label="Son değiştirilen parçalar" value={i.recentParts.join(", ")} />
        <Stat label="Ortalama tekrar aralığı" value={i.avgInterval} />
      </div>

      <div className="section-title mb-2 flex items-center gap-2"><HistoryIcon className="h-4 w-4" /> Tamamlanan kayıtlar</div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 card-soft animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="card-soft p-6 text-center mt-2">
          <div className="font-semibold mb-1">Henüz tamamlanmış kayıt yok</div>
          <div className="text-sm text-muted-foreground">Bir kaydı kanıtlı kapattığında burada görünecek.</div>
        </div>
      ) : (
        <div className="space-y-3">{data.map((w) => <WorkCard key={w.id} w={w} />)}</div>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card-soft p-3"><div className="label">{label}</div><div className="font-semibold text-sm mt-0.5">{value}</div></div>;
}
