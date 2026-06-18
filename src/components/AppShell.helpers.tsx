import { useMock } from "@/lib/mock";
import { Wifi, WifiOff, CloudUpload, AlertTriangle } from "lucide-react";

export function SyncChip() {
  const { sync, pendingCount } = useMock();
  const map: Record<string, { icon: any; text: string; cls: string }> = {
    online: { icon: Wifi, text: "Senkronize", cls: "text-success" },
    offline: { icon: WifiOff, text: "Çevrimdışı", cls: "text-muted-foreground" },
    syncing: { icon: CloudUpload, text: "Yükleniyor…", cls: "text-primary" },
    queued: { icon: CloudUpload, text: `${pendingCount} kayıt bekliyor`, cls: "text-warning-foreground" },
    failed: { icon: AlertTriangle, text: "Yükleme başarısız", cls: "text-destructive" },
    conflict: { icon: AlertTriangle, text: "Çakışma", cls: "text-destructive" },
  };
  const v = map[sync] ?? map.online;
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 h-7 rounded-full bg-surface-2 border border-border ${v.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {v.text}
    </span>
  );
}
