import { useMock, type LinkedRecord } from "@/lib/mock";
import { Link2 } from "lucide-react";

const RELATION_LABEL: Record<LinkedRecord["relation"], string> = {
  olusturuldu: "Bu kayıttan oluşturuldu",
  bagli_ariza: "Bağlantılı arıza",
  takip: "Takip işi",
  tekrar_test: "Tekrar test",
};

export function LinkedRecordsList({ workId }: { workId: string }) {
  const { linksFor } = useMock();
  const items = linksFor(workId);
  if (items.length === 0) return null;
  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-2 mb-2"><Link2 className="h-4 w-4" /><div className="label">Bağlantılı kayıtlar</div></div>
      <div className="space-y-2">
        {items.map((l) => (
          <div key={l.id} className="rounded-2xl border border-border p-3 text-sm">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="pill pill-ink">{l.toCode}</span>
              <span className="pill">{RELATION_LABEL[l.relation]}</span>
            </div>
            <div className="font-medium">{l.toTitle}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{l.at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
