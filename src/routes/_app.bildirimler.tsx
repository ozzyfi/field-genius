import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { useMock } from "@/lib/mock";
import { BellOff, ClipboardList, Package, MessageCircle, ArrowUpRight, RefreshCcw, RotateCcw, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/bildirimler")({
  ssr: false,
  component: BildirimlerPage,
});

const ICONS: Record<string, any> = {
  atama: ClipboardList, parca: Package, uzman: MessageCircle, oncelik: ArrowUpRight, sync: RefreshCcw, geri: RotateCcw, default: AlertTriangle,
};

function BildirimlerPage() {
  const { notifications, markAllRead, toggleRead, unreadCount } = useMock();
  return (
    <Screen title="Bildirimler">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
        {unreadCount > 0 && <button className="text-sm text-primary font-semibold" onClick={markAllRead}>Tümünü okundu yap</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="card-soft p-6 text-center mt-4">
          <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <div className="font-semibold mb-1">Bildirim yok</div>
          <div className="text-sm text-muted-foreground">Yeni bir atama veya yanıt geldiğinde burada görünecek.</div>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? ICONS.default;
            return (
              <li key={n.id}>
                <button onClick={() => toggleRead(n.id)} className={`card-soft w-full p-3 text-left flex items-start gap-3 tap ${n.unread ? "ring-1 ring-primary/30" : ""}`}>
                  <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${n.unread ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">{n.time}</div>
                    </div>
                    <div className="text-[13px] text-muted-foreground truncate">{n.body}</div>
                    {n.workId && (
                      <Link to="/is/$id" params={{ id: n.workId }} className="text-[12px] text-primary font-semibold mt-1 inline-block">
                        Kaydı aç →
                      </Link>
                    )}
                  </div>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
