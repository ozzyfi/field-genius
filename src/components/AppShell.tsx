import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, History, Sparkles, Plus, Bell, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useMock } from "@/lib/mock";
import { ProfileSheet } from "./ProfileSheet";
import { SyncChip } from "./AppShell.helpers";

export { SyncChip };

export function AppHeader({ title, right, back }: { title: string; right?: ReactNode; back?: () => void }) {
  const { profile } = useAuth();
  const { unreadCount } = useMock();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = (profile?.full_name || "T").trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklch,var(--color-background)_85%,transparent)] border-b border-border">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {back ? (
            <button onClick={back} className="h-8 w-8 grid place-items-center rounded-full hover:bg-surface-2 tap" aria-label="Geri">‹</button>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-ink text-ink-foreground flex items-center justify-center font-bold text-sm tracking-tight">T</div>
          )}
          <div className="font-semibold text-[15px] leading-none truncate">{title}</div>
        </div>
        <div className="flex items-center gap-1">
          <SyncChip />
          {right}
          <button
            onClick={() => navigate({ to: "/bildirimler" })}
            className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2 tap"
            aria-label="Bildirimler"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">{unreadCount}</span>
            )}
          </button>
          <button
            className="h-9 w-9 grid place-items-center rounded-full bg-ink text-ink-foreground text-xs font-bold tap"
            onClick={() => setProfileOpen(true)}
            title="Profil"
            aria-label="Profil"
          >
            {initials || <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { focus, anyDirty, saveDraftSnapshot, discardDraft, drafts } = useMock();
  const [confirm, setConfirm] = useState<null | { to: string }>(null);

  if (focus) return null;

  const items = [
    { to: "/islerim", label: "İşlerim", icon: Home },
    { to: "/ai", label: "ToolA AI", icon: Sparkles },
    { to: "/gecmis", label: "Geçmiş", icon: History },
  ] as const;

  const hidePlus = pathname.startsWith("/yeni");

  // detect the currently-edited workId from URL (/is/:id)
  function currentWorkId(): string | null {
    const m = pathname.match(/^\/is\/([^/]+)/);
    return m ? m[1] : null;
  }

  function go(to: string) {
    if (anyDirty() && pathname !== to) { setConfirm({ to }); return; }
    navigate({ to: to as any });
  }

  function onSave() {
    if (!confirm) return;
    const id = currentWorkId();
    if (id) saveDraftSnapshot(id);
    else Object.keys(drafts).forEach(saveDraftSnapshot);
    const to = confirm.to;
    setConfirm(null);
    navigate({ to: to as any });
  }
  function onDiscard() {
    if (!confirm) return;
    const id = currentWorkId();
    if (id) discardDraft(id);
    const to = confirm.to;
    setConfirm(null);
    navigate({ to: to as any });
  }

  return (
    <>
      <nav className="fixed left-0 right-0 z-40 px-5" style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}>
        <div className="mx-auto max-w-md relative">
          <div
            className="relative flex items-center gap-1 rounded-full p-1.5 bg-ink text-ink-foreground"
            style={{ boxShadow: "0 18px 40px -12px rgba(10, 12, 30, 0.45), 0 4px 14px -6px rgba(10, 12, 30, 0.35)" }}
          >
            {items.map((it) => {
              const active = pathname === it.to || pathname.startsWith(it.to + "/");
              const Icon = it.icon;
              const isLast = it.to === "/gecmis";
              return (
                <button
                  key={it.to}
                  onClick={() => go(it.to)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full tap transition-colors ${
                    active ? "bg-primary text-primary-foreground font-semibold" : "text-ink-foreground/60 hover:text-ink-foreground"
                  } ${isLast && !hidePlus ? "pr-8" : ""}`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
                  <span className="text-[12px] leading-none">{it.label}</span>
                </button>
              );
            })}
          </div>
          {!hidePlus && (
            <button
              onClick={() => go("/yeni")}
              className="absolute -top-4 -right-2 h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center tap"
              style={{ boxShadow: "0 10px 24px -8px color-mix(in oklch, var(--color-primary) 65%, transparent), 0 4px 10px -4px rgba(10,12,30,0.3)" }}
              aria-label="Yeni Kayıt"
            >
              <Plus className="h-6 w-6" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </nav>

      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={() => setConfirm(null)}>
          <div className="w-full bg-card rounded-t-3xl p-5 max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto h-1 w-10 bg-border rounded-full mb-3" />
            <div className="font-semibold mb-1">Kaydedilmemiş değişiklikler var</div>
            <p className="text-sm text-muted-foreground mb-4">Bu ekrandan ayrılırsan yaptıkların kaybolabilir.</p>
            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={onSave}>
                Taslağı kaydet ve çık
              </button>
              <button className="btn btn-ghost w-full" onClick={() => setConfirm(null)}>Düzenlemeye devam et</button>
              <button className="btn w-full text-destructive" onClick={onDiscard}>
                Değişiklikleri sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Screen({ title, right, back, children }: { title: string; right?: ReactNode; back?: () => void; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      <AppHeader title={title} right={right} back={back} />
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}

export function CompletedBadge({ tone = "success", children }: { tone?: "success" | "warning"; children: ReactNode }) {
  return <span className={tone === "success" ? "pill pill-success" : "pill pill-warning"}>{children}</span>;
}
