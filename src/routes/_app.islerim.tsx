import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMock } from "@/lib/mock";
import { Screen } from "@/components/AppShell";
import { WorkCard, type WorkRow } from "@/components/WorkCard";
import { ContinueCard } from "@/components/ContinueCard";
import { Search, BellOff, ClipboardList } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/islerim")({
  ssr: false,
  component: IslerimPage,
});

const FILTERS = [
  { key: "tumu", label: "Tümü" },
  { key: "atanan", label: "Bana atanan" },
  { key: "bugun", label: "Bugün planlanan" },
  { key: "devam", label: "Devam eden" },
  { key: "destek", label: "Destek bekleyen" },
  { key: "eksik", label: "Kapanışı eksik" },
  { key: "tamam", label: "Tamamlanan" },
] as const;

function IslerimPage() {
  const { user, profile } = useAuth();
  const { drafts } = useMock();
  const navigate = useNavigate();
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

  // Active in-progress draft (mock) — pick the most recently saved
  const activeDraft = useMemo(() => {
    const arr = Object.values(drafts);
    if (arr.length === 0) return null;
    arr.sort((a, b) => b.lastSavedAt - a.lastSavedAt);
    const top = arr[0];
    const row = rows.find((r) => r.id === top.workId);
    return row ? { draft: top, row } : null;
  }, [drafts, rows]);

  const filtered = rows.filter((w) => {
    if (q && !`${w.title} ${w.description ?? ""} ${w.code}`.toLowerCase().includes(q.toLowerCase())) return false;
    switch (filter) {
      case "atanan": return w.source === "atanan";
      case "bugun": return new Date(w.created_at).toDateString() === new Date().toDateString();
      case "devam": return w.status === "devam_ediyor";
      case "destek": return !!drafts[w.id]?.support;
      case "eksik": return w.status === "kapanis_eksik";
      case "tamam": return w.status === "tamamlandi";
      default: return true;
    }
  });

  const sections: { title: string; items: WorkRow[] }[] = filter === "tumu" ? [
    { title: "Bana atanan", items: filtered.filter((w) => w.source === "atanan" && w.status !== "tamamlandi") },
    { title: "Bugün planlanan", items: filtered.filter((w) => new Date(w.created_at).toDateString() === new Date().toDateString() && w.source !== "atanan" && w.status !== "tamamlandi") },
    { title: "Devam eden", items: filtered.filter((w) => w.status === "devam_ediyor" && !drafts[w.id]?.support && w.source !== "atanan") },
    { title: "Destek / parça bekleyen", items: filtered.filter((w) => !!drafts[w.id]?.support) },
    { title: "Kapanışı eksik", items: filtered.filter((w) => w.status === "kapanis_eksik") },
  ] : [{ title: FILTERS.find((f) => f.key === filter)!.label, items: filtered }];

  return (
    <Screen title="İşlerim">
      <div className="mb-4">
        <div className="text-[13px] text-muted-foreground">Merhaba {profile?.full_name || "Teknisyen"}</div>
        <h1 className="text-2xl font-bold tracking-tight">Şimdi ne yapmalıyım?</h1>
      </div>

      {activeDraft && (
        <div className="mb-4">
          <div className="section-title mb-2">Devam ettiğin iş</div>
          <div className="card-soft p-4 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="pill pill-ink">{activeDraft.row.code}</span>
              <span className="pill pill-primary">Devam ediyor</span>
            </div>
            <div className="font-semibold">{activeDraft.row.title}</div>
            <div className="text-[12px] text-muted-foreground">{activeDraft.row.machine?.name ?? "—"} • {activeDraft.row.machine?.location ?? "—"}</div>
          </div>
          <ContinueCard draft={activeDraft.draft} onContinue={() => navigate({ to: "/is/$id", params: { id: activeDraft.row.id } })} />
        </div>
      )}

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Kayıt, makine veya kod ara" />
      </div>

      <div className="-mx-4 px-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`pill ${filter === f.key ? "pill-ink" : ""}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 card-soft animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        q ? <EmptySearch /> : <EmptyAssigned />
      ) : (
        <div className="space-y-5">
          {sections.filter((s) => s.items.length > 0).map((s) => (
            <section key={s.title}>
              <div className="section-title mb-2">{s.title} <span className="text-muted-foreground">({s.items.length})</span></div>
              <div className="space-y-3">{s.items.map((w) => <WorkCard key={w.id} w={w} />)}</div>
            </section>
          ))}
          {sections.every((s) => s.items.length === 0) && <EmptyAssigned />}
        </div>
      )}
    </Screen>
  );
}

function EmptyAssigned() {
  return (
    <div className="card-soft p-6 text-center mt-4">
      <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="font-semibold mb-1">Sana atanmış iş yok</div>
      <div className="text-sm text-muted-foreground">Sahada bir durumla karşılaştıysan + tuşuyla hızlıca kaydet.</div>
    </div>
  );
}
function EmptySearch() {
  return (
    <div className="card-soft p-6 text-center mt-4">
      <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="font-semibold mb-1">Sonuç bulunamadı</div>
      <div className="text-sm text-muted-foreground">Farklı bir anahtar kelime veya filtre dene.</div>
    </div>
  );
}
