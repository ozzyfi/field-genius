import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground text-sm">Yükleniyor…</div>
      </div>
    );
  }
  return <Navigate to={user ? "/islerim" : "/auth"} />;
}
