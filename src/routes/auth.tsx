import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/islerim", replace: true });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = mode === "in" ? await signIn(email, password) : await signUp(email, password, name);
      if (res.error) toast.error(res.error);
      else if (mode === "up") toast.success("Hesap oluşturuldu. Giriş yapılıyor…");
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    setBusy(true);
    const demoEmail = "demo@toola.app";
    const demoPass = "demo1234";
    let res = await signIn(demoEmail, demoPass);
    if (res.error) {
      await signUp(demoEmail, demoPass, "Demo Teknisyen");
      res = await signIn(demoEmail, demoPass);
    }
    if (res.error) toast.error(res.error);
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-md px-5 pt-16 pb-10 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-ink text-ink-foreground grid place-items-center font-bold text-xl">T</div>
          <div>
            <div className="text-xl font-bold tracking-tight">ToolA</div>
            <div className="text-[12px] text-muted-foreground">Saha teknisyeni için operasyonel hafıza</div>
          </div>
        </div>

        <div className="card-soft p-5">
          <div className="flex gap-1 p-1 bg-surface-2 rounded-full mb-5 text-sm font-semibold">
            <button onClick={() => setMode("in")} className={`flex-1 h-9 rounded-full ${mode === "in" ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}>Giriş yap</button>
            <button onClick={() => setMode("up")} className={`flex-1 h-9 rounded-full ${mode === "up" ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}>Hesap oluştur</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "up" && (
              <div>
                <label className="label block mb-1">Ad Soyad</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mehmet Yılmaz" required />
              </div>
            )}
            <div>
              <label className="label block mb-1">E-posta</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teknisyen@firma.com" required />
            </div>
            <div>
              <label className="label block mb-1">Şifre</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>
            <button disabled={busy} className="btn btn-primary w-full mt-2">{busy ? "..." : mode === "in" ? "Giriş yap" : "Hesap oluştur"}</button>
          </form>
        </div>

        <button onClick={loadDemo} disabled={busy} className="btn btn-ghost w-full mt-4">Demo hesabıyla devam et</button>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Devam ederek ToolA kullanım koşullarını kabul etmiş olursun.
        </p>
      </div>
    </div>
  );
}
