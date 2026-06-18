import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BottomSheet } from "./FocusSheet";
import { useAuth } from "@/lib/auth";
import { useMock } from "@/lib/mock";
import { SyncChip } from "./AppShell.helpers";
import { User, Settings, LogOut, CloudUpload } from "lucide-react";

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { profile, user, signOut } = useAuth();
  const { sync, pendingCount, setSync, anyDirty } = useMock();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <BottomSheet title="Profil" onClose={onClose}>
      <div className="card-soft p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-ink text-ink-foreground grid place-items-center font-bold">
            {(profile?.full_name || "T").split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold">{profile?.full_name || "Teknisyen"}</div>
            <div className="text-[12px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="card-soft p-4 mb-3 space-y-2">
        <div className="label">Senkronizasyon</div>
        <div className="flex items-center justify-between">
          <SyncChip />
          <button onClick={() => { setSync("syncing"); }} className="btn btn-ghost text-xs h-9"><CloudUpload className="h-4 w-4" /> Şimdi senkronize et</button>
        </div>
        <div className="text-[12px] text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} kayıt sırada` : "Tüm kayıtlar güncel"}{anyDirty() ? " • Kaydedilmemiş taslaklar var" : ""}
        </div>
      </div>

      <div className="space-y-2">
        <button className="btn btn-ghost w-full justify-start" onClick={() => { onClose(); navigate({ to: "/bildirimler" }); }}>
          <User className="h-4 w-4" /> Bildirimler
        </button>
        <button className="btn btn-ghost w-full justify-start" onClick={() => { /* future */ }}>
          <Settings className="h-4 w-4" /> Ayarlar
        </button>
        {!confirmLogout ? (
          <button className="btn btn-ghost w-full justify-start text-destructive" onClick={() => setConfirmLogout(true)}>
            <LogOut className="h-4 w-4" /> Çıkış yap
          </button>
        ) : (
          <div className="card-soft p-3">
            <div className="font-semibold mb-1 text-sm">Çıkış yapmak istediğine emin misin?</div>
            <div className="text-[12px] text-muted-foreground mb-3">Kaydedilmemiş taslaklar cihazda kalır.</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirmLogout(false)}>Vazgeç</button>
              <button className="btn btn-danger" onClick={async () => { await signOut(); onClose(); navigate({ to: "/auth" }); }}>Çıkış yap</button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
