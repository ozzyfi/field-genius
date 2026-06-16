import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, History, Sparkles, Plus, Bell, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function AppHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.full_name || "T").trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklch,var(--color-background)_85%,transparent)] border-b border-border">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-ink text-ink-foreground flex items-center justify-center font-bold text-sm tracking-tight">T</div>
          <div className="font-semibold text-[15px] leading-none">{title}</div>
        </div>
        <div className="flex items-center gap-1">
          {right}
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-2 tap" aria-label="Bildirimler">
            <Bell className="h-5 w-5" />
          </button>
          <button
            className="h-9 w-9 grid place-items-center rounded-full bg-ink text-ink-foreground text-xs font-bold tap"
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            title="Çıkış"
          >
            {initials || <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const items = [
    { to: "/islerim", label: "İşlerim", icon: Home },
    { to: "/ai", label: "ToolA AI", icon: Sparkles },
    { to: "/gecmis", label: "Geçmiş", icon: History },
  ] as const;
  return (
    <nav className="bottom-nav">
      <div className="mx-auto max-w-md grid grid-cols-3 items-center gap-1 relative">
        {items.map((it, idx) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl tap ${active ? "text-foreground" : "text-muted-foreground"}`}
              style={idx === 1 ? { paddingTop: 24 } : undefined}
            >
              {idx === 1 ? null : <Icon className="h-5 w-5" />}
              {idx === 1 ? <span className="h-5" /> : null}
              <span className="text-[11px] font-semibold">{it.label}</span>
              {active && <span className="absolute top-0 -translate-y-1 h-1 w-8 rounded-full bg-primary" style={{ left: `calc(${idx} * 33.333% + 16.6% - 16px)` }} />}
            </Link>
          );
        })}
        <button
          onClick={() => navigate({ to: "/yeni" })}
          className="absolute left-1/2 -translate-x-1/2 -top-6 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 ring-4 ring-background tap"
          aria-label="Yeni Kayıt"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>
    </nav>
  );
}

export function Screen({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      <AppHeader title={title} right={right} />
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
