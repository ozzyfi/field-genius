import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { MockProvider } from "@/lib/mock";
import { Toaster } from "sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f6f1e7" },
      { title: "ToolA — Saha Teknisyeni Operasyonel Hafıza" },
      { name: "description", content: "ToolA, saha teknik ekipleri için operasyonel hafıza platformudur. Arıza, bakım, test ve kurulum kayıtlarını sesli özet ve kanıtla kapatın." },
      { property: "og:title", content: "ToolA — Saha Teknisyeni Operasyonel Hafıza" },
      { property: "og:description", content: "Saha teknisyenleri için sesli kapanış, kanıtlı kayıt ve makine geçmişi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MockProvider>
          <Outlet />
          <Toaster position="top-center" richColors closeButton />
        </MockProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
