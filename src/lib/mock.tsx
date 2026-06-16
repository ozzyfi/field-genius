import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MOCK_NOTIFICATIONS } from "./mockData";

type SyncStatus = "online" | "offline" | "syncing" | "queued" | "failed" | "conflict";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  workId?: string | null;
};

export type DraftEvidence = {
  id: string;
  kind: "foto" | "video" | "ses" | "olcum" | "hata_kodu" | "belge" | "barkod";
  side: "once" | "sirasinda" | "sonra";
  label: string;
  value?: string;
  thumb?: string;
};

export type WorkDraft = {
  workId: string;
  step: number; // 0..4
  initial?: string;
  intervention?: string;
  parts?: string[];
  result?: string;
  followUp?: string;
  rootCause?: string;
  rootCauseStatus?: "kesin" | "tahmini" | "bilinmiyor";
  voiceTranscript?: string;
  evidence: DraftEvidence[];
  template?: Record<string, any>;
  machineOverride?: string;
  locationOverride?: string;
  lastSavedAt: number;
  // assignment lifecycle
  accepted?: boolean;
  // support state
  support?: {
    category: string;
    body: Record<string, any>;
    waitingSince: string;
    timeline: { at: string; text: string }[];
  } | null;
};

type Ctx = {
  focus: boolean;
  setFocus: (v: boolean) => void;

  sync: SyncStatus;
  setSync: (s: SyncStatus) => void;
  pendingCount: number;
  setPendingCount: (n: number) => void;

  notifications: Notification[];
  markAllRead: () => void;
  toggleRead: (id: string) => void;
  unreadCount: number;

  dirty: boolean;
  setDirty: (v: boolean) => void;

  drafts: Record<string, WorkDraft>;
  getDraft: (workId: string) => WorkDraft | undefined;
  updateDraft: (workId: string, patch: Partial<WorkDraft>) => void;
  clearDraft: (workId: string) => void;
};

const MockCtx = createContext<Ctx | null>(null);

export function MockProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false);
  const [sync, setSync] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(3);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS as Notification[]);
  const [dirty, setDirty] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, WorkDraft>>({});

  const markAllRead = useCallback(() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false }))), []);
  const toggleRead = useCallback((id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))), []);
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const getDraft = useCallback((workId: string) => drafts[workId], [drafts]);
  const updateDraft = useCallback((workId: string, patch: Partial<WorkDraft>) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      return { ...d, [workId]: { ...cur, ...patch, lastSavedAt: Date.now() } };
    });
  }, []);
  const clearDraft = useCallback((workId: string) => setDrafts((d) => { const n = { ...d }; delete n[workId]; return n; }), []);

  // Simulate sync cycles for the demo
  useEffect(() => {
    if (sync !== "syncing") return;
    const t = setTimeout(() => { setSync("online"); setPendingCount(0); }, 1800);
    return () => clearTimeout(t);
  }, [sync]);

  const value: Ctx = {
    focus, setFocus,
    sync, setSync, pendingCount, setPendingCount,
    notifications, markAllRead, toggleRead, unreadCount,
    dirty, setDirty,
    drafts, getDraft, updateDraft, clearDraft,
  };
  return <MockCtx.Provider value={value}>{children}</MockCtx.Provider>;
}

export function useMock() {
  const ctx = useContext(MockCtx);
  if (!ctx) throw new Error("useMock outside MockProvider");
  return ctx;
}
