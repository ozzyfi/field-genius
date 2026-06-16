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
    <nav
      className="fixed left-0 right-0 z-40 px-5"
      style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
    >
      <div className="mx-auto max-w-md relative">
        <div
          className="relative flex items-center gap-1 rounded-full p-1.5 bg-ink text-ink-foreground"
          style={{ boxShadow: "0 18px 40px -12px rgba(10, 12, 30, 0.45), 0 4px 14px -6px rgba(10, 12, 30, 0.35)" }}
        >
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full tap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-ink-foreground/60 hover:text-ink-foreground"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
                <span className="text-[12px] leading-none">{it.label}</span>
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => navigate({ to: "/yeni" })}
          className="absolute -top-4 -right-2 h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center tap"
          style={{ boxShadow: "0 10px 24px -8px color-mix(in oklch, var(--color-primary) 65%, transparent), 0 4px 10px -4px rgba(10,12,30,0.3)" }}
          aria-label="Yeni Kayıt"
        >
          <Plus className="h-6 w-6" strokeWidth={2.4} />
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
