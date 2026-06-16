import { useState } from "react";
import { BottomSheet } from "./FocusSheet";
import { MOCK_MACHINES, MOCK_LOCATIONS, MOCK_PARTS, MOCK_RECENT_MACHINES } from "@/lib/mockData";
import { Search, QrCode, MapPin, Wrench, AlertTriangle } from "lucide-react";

export function MachinePicker({ onPick, onClose, onScanQr }: { onPick: (m: typeof MOCK_MACHINES[number]) => void; onClose: () => void; onScanQr?: () => void }) {
  const [q, setQ] = useState("");
  const [site, setSite] = useState<string | null>(null);
  const sites = Array.from(new Set(MOCK_MACHINES.map((m) => m.location.split(" / ")[0])));
  const filtered = MOCK_MACHINES.filter((m) => {
    if (site && !m.location.startsWith(site)) return false;
    if (!q) return true;
    return `${m.name} ${m.code} ${m.model} ${m.serial}`.toLowerCase().includes(q.toLowerCase());
  });
  const recents = MOCK_RECENT_MACHINES.map((id) => MOCK_MACHINES.find((m) => m.id === id)!).filter(Boolean);

  return (
    <BottomSheet title="Makine seç" onClose={onClose}>
      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="input pl-10" placeholder="Ad, kod, model, seri" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        <button onClick={onScanQr} className="pill pill-ink shrink-0"><QrCode className="h-3.5 w-3.5" /> QR ile tara</button>
        <button onClick={() => setSite(null)} className={`pill shrink-0 ${!site ? "pill-ink" : ""}`}>Tüm tesisler</button>
        {sites.map((s) => (
          <button key={s} onClick={() => setSite(s)} className={`pill shrink-0 ${site === s ? "pill-ink" : ""}`}>{s}</button>
        ))}
      </div>

      {!q && !site && (
        <>
          <div className="section-title mb-2">Son kullanılanlar</div>
          <div className="space-y-2 mb-4">
            {recents.map((m) => <MachineRow key={m.id} m={m} onPick={() => onPick(m)} />)}
          </div>
        </>
      )}

      <div className="section-title mb-2">{q || site ? "Sonuçlar" : "Tümü"}</div>
      {filtered.length === 0 ? (
        <div className="card-soft p-5 text-center text-sm text-muted-foreground">Sonuç bulunamadı. QR taramayı deneyebilirsin.</div>
      ) : (
        <div className="space-y-2">{filtered.map((m) => <MachineRow key={m.id} m={m} onPick={() => onPick(m)} />)}</div>
      )}
    </BottomSheet>
  );
}

function MachineRow({ m, onPick }: { m: typeof MOCK_MACHINES[number]; onPick: () => void }) {
  return (
    <button onClick={onPick} className="card-soft w-full p-3 text-left tap">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">{m.name}</div>
          <div className="text-[12px] text-muted-foreground truncate">{m.code} • {m.model}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`pill ${m.status === "Çalışıyor" ? "pill-success" : m.status === "Uyarı" ? "pill-warning" : ""}`}>{m.status}</span>
          {m.openWork > 0 && <span className="pill pill-danger">{m.openWork} açık iş</span>}
        </div>
      </div>
    </button>
  );
}

export function LocationPicker({ onPick, onClose }: { onPick: (l: typeof MOCK_LOCATIONS[number]) => void; onClose: () => void }) {
  const [site, setSite] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const sites = Array.from(new Set(MOCK_LOCATIONS.map((l) => l.site)));
  const buildings = Array.from(new Set(MOCK_LOCATIONS.filter((l) => !site || l.site === site).map((l) => l.building)));
  const items = MOCK_LOCATIONS.filter((l) => (!site || l.site === site) && (!building || l.building === building));
  return (
    <BottomSheet title="Lokasyon seç" onClose={onClose}>
      <div className="section-title mb-2">Tesis</div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => { setSite(null); setBuilding(null); }} className={`pill ${!site ? "pill-ink" : ""}`}>Hepsi</button>
        {sites.map((s) => <button key={s} onClick={() => { setSite(s); setBuilding(null); }} className={`pill ${site === s ? "pill-ink" : ""}`}>{s}</button>)}
      </div>
      {site && (
        <>
          <div className="section-title mb-2">Bina</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={() => setBuilding(null)} className={`pill ${!building ? "pill-ink" : ""}`}>Hepsi</button>
            {buildings.map((b) => <button key={b} onClick={() => setBuilding(b)} className={`pill ${building === b ? "pill-ink" : ""}`}>{b}</button>)}
          </div>
        </>
      )}
      <div className="section-title mb-2">Alan / Oda</div>
      <div className="space-y-2">
        {items.map((l) => (
          <button key={l.id} onClick={() => onPick(l)} className="card-soft w-full p-3 text-left tap">
            <div className="font-semibold text-sm">{l.area} / {l.room}</div>
            <div className="text-[12px] text-muted-foreground">{l.site} • {l.building} • {l.floor}</div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

export function PartPicker({ onPick, onClose }: { onPick: (p: typeof MOCK_PARTS[number]) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const items = MOCK_PARTS.filter((p) => !q || `${p.name} ${p.code}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <BottomSheet title="Parça seç" onClose={onClose}>
      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="input pl-10" placeholder="Parça adı veya kodu" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="space-y-2">
        {items.map((p) => (
          <button key={p.id} onClick={() => onPick(p)} className="card-soft w-full p-3 text-left flex items-center justify-between tap">
            <div>
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-[12px] text-muted-foreground">{p.code}</div>
            </div>
            <span className={`pill ${p.stock < 5 ? "pill-warning" : "pill-success"}`}>Stok {p.stock}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
