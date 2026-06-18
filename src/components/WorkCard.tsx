import { Link } from "@tanstack/react-router";
import { WORK_TYPE_LABEL, STATUS_LABEL, PRIORITY_LABEL, SOURCE_LABEL, statusPillClass, priorityPillClass, formatDateTr } from "@/lib/toola";
import { MapPin, Wrench, ChevronRight, Calendar } from "lucide-react";

export type WorkRow = {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  title: string;
  description: string | null;
  location_note: string | null;
  created_at: string;
  machine?: { name: string | null; location: string | null; model?: string | null; serial?: string | null } | null;
};

function plannedChip(iso: string | null | undefined): { label: string; cls: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  if (d.getTime() < now.getTime() - 60000 && !sameDay) return { label: "Gecikti", cls: "pill pill-danger" };
  if (sameDay) return { label: "Bugün", cls: "pill pill-primary" };
  if (isTomorrow) return { label: "Yarın", cls: "pill pill-warning" };
  return { label: "Planlandı", cls: "pill" };
}

export function WorkCard({ w, plannedAt }: { w: WorkRow; plannedAt?: string | null }) {
  const chip = plannedChip(plannedAt);
  return (
    <Link
      to="/is/$id"
      params={{ id: w.id }}
      className="card-soft block p-4 active:scale-[0.995] transition tap"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="pill pill-ink">{WORK_TYPE_LABEL[w.type] || w.type}</span>
            <span className={statusPillClass(w.status)}>{STATUS_LABEL[w.status] || w.status}</span>
            {w.priority !== "normal" && (
              <span className={priorityPillClass(w.priority)}>{PRIORITY_LABEL[w.priority]}</span>
            )}
            {chip && <span className={chip.cls}>{chip.label}</span>}
          </div>
          <div className="font-semibold text-[15px] leading-snug truncate">{w.title}</div>
          {w.description && (
            <div className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5">{w.description}</div>
          )}
          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" />{w.machine?.name || "Makine yok"}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{w.machine?.location || w.location_note || "—"}</span>
            {plannedAt && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDateTr(plannedAt)}</span>}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground/80">
            {SOURCE_LABEL[w.source]} • {w.code} • {formatDateTr(w.created_at)}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Link>
  );
}
