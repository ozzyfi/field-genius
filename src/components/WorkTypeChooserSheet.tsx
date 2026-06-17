import { BottomSheet } from "./FocusSheet";
import { AlertTriangle, Wrench, ClipboardCheck, Replace, FileText } from "lucide-react";

const OPTIONS = [
  { k: "ariza", label: "Arıza bildir", icon: AlertTriangle, desc: "Üretimi etkileyen sorun" },
  { k: "bakim", label: "Bakım başlat", icon: Wrench, desc: "Periyodik ya da plansız bakım" },
  { k: "test", label: "Test / kontrol", icon: ClipboardCheck, desc: "Ölçüm veya doğrulama" },
  { k: "parca", label: "Parça değişimi", icon: Replace, desc: "Parça sök-tak işlemi" },
  { k: "diger", label: "Gözlem kaydı", icon: FileText, desc: "Sadece not / fotoğraf" },
] as const;

export function WorkTypeChooserSheet({ machineName, onClose, onPick }: {
  machineName: string;
  onClose: () => void;
  onPick: (k: typeof OPTIONS[number]["k"]) => void;
}) {
  return (
    <BottomSheet title="Bu makine için ne yapmak istiyorsun?" onClose={onClose}>
      <div className="text-sm text-muted-foreground mb-3">{machineName}</div>
      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <button key={o.k} onClick={() => onPick(o.k)} className="card-soft w-full p-3 text-left flex items-center gap-3 tap">
            <div className="h-10 w-10 rounded-full bg-surface-2 grid place-items-center">
              <o.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold">{o.label}</div>
              <div className="text-[12px] text-muted-foreground">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
