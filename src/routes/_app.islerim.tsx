import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Screen } from "@/components/AppShell";
import { WorkCard, type WorkRow } from "@/components/WorkCard";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/islerim")({
  ssr: false,
  component: IslerimPage,
});

const FILTERS = [
  { key: "tumu", label: "Tümü" },
  { key: "atanan", label: "Bana atanan" },
  { key: "benim", label: "Benim açtıklarım" },
  { key: "devam", label: "Devam eden" },
  { key: "bekleyen", label: "Bekleyen" },
  { key: "eksik", label: "Kapanış eksik" },
  { key: "tamam", label: "Tamamlanan" },
] as const;

function IslerimPage() {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("tumu");
  const [q, setQ] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["work-records", profile?.org_id, user?.id],
    enabled: !!profile?.org_id,
    queryFn: async (): Promise<WorkRow[]> => {
      const { data, error } = await supabase
        .from("work_records")
        .select("id, code, type, status, priority, source, title, description, location_note, created_at, machine:machines(name, location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WorkRow[];
    },
  });

  const filtered = rows.filter((w) => {
    if (q && !`${w.title} ${w.description ?? ""} ${w.code}`.toLowerCase().includes(q.toLowerCase())) return false;
    switch (filter) {
      case "atanan": return true; // for demo, assigned = all not closed (single-user)
      case "benim": return true;
      case "devam": return w.status === "devam_ediyor";
      case "bekleyen": return w.status === "beklemede";
      case "eksik": return w.status === "kapanis_eksik";
      case "tamam": return w.status === "tamamlandi";
      default: return true;
    }
  });

  return (
    <Screen title="İşlerim">
      <div className="mb-4">
        <div className="text-[13px] text-muted-foreground">Merhaba {profile?.full_name || "Teknisyen"}</div>
        <h1 className="text-2xl font-bold tracking-tight">Şimdi ne yapmalıyım?</h1>
      </div>

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Kayıt, makine veya kod ara" />
      </div>

      <div className="-mx-4 px-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`pill ${filter === f.key ? "pill-ink" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 card-soft animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => <WorkCard key={w.id} w={w} />)}
        </div>
      )}
    </Screen>
  );
}

function EmptyState() {
  return (
    <div className="card-soft p-6 text-center mt-4">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-surface-2 grid place-items-center text-2xl mb-3">📋</div>
      <div className="font-semibold mb-1">Bekleyen iş yok</div>
      <div className="text-sm text-muted-foreground mb-4">Sahada bir durumla karşılaştıysan + tuşuyla hızlıca kaydet.</div>
    </div>
  );
}
