import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Screen } from "@/components/AppShell";
import { WorkCard, type WorkRow } from "@/components/WorkCard";

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

  return (
    <Screen title="Geçmiş">
      <h1 className="text-2xl font-bold tracking-tight mb-3">Tamamlanan kayıtlar</h1>
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 card-soft animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="card-soft p-6 text-center mt-4">
          <div className="font-semibold mb-1">Henüz tamamlanmış kayıt yok</div>
          <div className="text-sm text-muted-foreground">Bir kaydı kanıtlı kapattığında burada görünecek.</div>
        </div>
      ) : (
        <div className="space-y-3">{data.map((w) => <WorkCard key={w.id} w={w} />)}</div>
      )}
    </Screen>
  );
}
