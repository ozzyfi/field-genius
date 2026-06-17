import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  stepId?: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  status?: "uygun" | "sorun" | "na";
  note?: string;
};

export type MeasurementRow = {
  id: string;
  value: string;
  unit?: string;
  at?: string;
  note?: string;
  verdict?: "gecti" | "kaldi" | "sinirda";
};

export type Finding = {
  id: string;
  text: string;
  action?: "ariza" | "takip" | "gozlem";
};

export type PunchItem = {
  id: string;
  text: string;
  owner?: string;
  due?: string;
  done?: boolean;
};

export type LinkedRecord = {
  id: string;
  fromWorkId: string;
  toWorkId?: string;
  toCode: string;
  toType: "ariza" | "bakim" | "test" | "kurulum" | "parca" | "diger";
  toTitle: string;
  relation: "olusturuldu" | "bagli_ariza" | "takip" | "tekrar_test";
  at: string;
};

export type SupportCategory = "parca" | "uzman" | "ekip" | "erisim" | "tekraryok" | "vardiya";

export type WorkDraft = {
  workId: string;
  workType?: "ariza" | "bakim" | "test" | "kurulum" | "parca" | "diger";

  // legacy fields kept for compat
  step: number;
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

  // new — workflow state
  currentStepId?: string;
  completedSteps?: string[];

  // structured data per workflow
  checklist?: ChecklistItem[];
  measurements?: MeasurementRow[];
  diagnosticChecks?: { id: string; title: string; result: "normal" | "sorun" | "emin_degil"; at: string }[];
  identifiedCause?: string;
  findings?: Finding[];
  punchList?: PunchItem[];

  // assignment lifecycle
  accepted?: boolean;

  // support state
  support?: {
    category: SupportCategory;
    body: Record<string, any>;
    waitingSince: string;
    timeline: { at: string; text: string }[];
    resolved?: boolean;
  } | null;

  // completion gating
  blocked?: boolean;
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
  discardDraft: (workId: string) => void;

  startWorkflow: (workId: string, type: WorkDraft["workType"]) => void;
  setStep: (workId: string, stepId: string) => void;
  markStepDone: (workId: string, stepId: string) => void;

  linkedRecords: LinkedRecord[];
  addLinkedRecord: (r: Omit<LinkedRecord, "id" | "at">) => LinkedRecord;
  linksFor: (workId: string) => LinkedRecord[];
};

const MockCtx = createContext<Ctx | null>(null);

const DRAFTS_KEY = "toola.drafts.v2";
const LINKS_KEY = "toola.links.v1";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

export function MockProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false);
  const [sync, setSync] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(3);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS as Notification[]);
  const [dirty, setDirty] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, WorkDraft>>({});
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecord[]>([]);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setDrafts(loadJSON<Record<string, WorkDraft>>(DRAFTS_KEY, {}));
    setLinkedRecords(loadJSON<LinkedRecord[]>(LINKS_KEY, []));
    hydrated.current = true;
  }, []);

  // Persist drafts
  useEffect(() => {
    if (!hydrated.current) return;
    try { window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch {}
  }, [drafts]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { window.localStorage.setItem(LINKS_KEY, JSON.stringify(linkedRecords)); } catch {}
  }, [linkedRecords]);

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
  const discardDraft = useCallback((workId: string) => setDrafts((d) => { const n = { ...d }; delete n[workId]; return n; }), []);

  const startWorkflow = useCallback((workId: string, type: WorkDraft["workType"]) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      return { ...d, [workId]: { ...cur, workType: type, accepted: true, lastSavedAt: Date.now() } };
    });
  }, []);

  const setStep = useCallback((workId: string, stepId: string) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      return { ...d, [workId]: { ...cur, currentStepId: stepId, lastSavedAt: Date.now() } };
    });
  }, []);

  const markStepDone = useCallback((workId: string, stepId: string) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      const done = new Set(cur.completedSteps ?? []);
      done.add(stepId);
      return { ...d, [workId]: { ...cur, completedSteps: Array.from(done), lastSavedAt: Date.now() } };
    });
  }, []);

  const addLinkedRecord = useCallback((r: Omit<LinkedRecord, "id" | "at">) => {
    const full: LinkedRecord = { ...r, id: `lr-${Date.now()}`, at: new Date().toLocaleString("tr-TR") };
    setLinkedRecords((arr) => [full, ...arr]);
    return full;
  }, []);

  const linksFor = useCallback((workId: string) => linkedRecords.filter((l) => l.fromWorkId === workId || l.toWorkId === workId), [linkedRecords]);

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
    drafts, getDraft, updateDraft, clearDraft, discardDraft,
    startWorkflow, setStep, markStepDone,
    linkedRecords, addLinkedRecord, linksFor,
  };
  return <MockCtx.Provider value={value}>{children}</MockCtx.Provider>;
}

export function useMock() {
  const ctx = useContext(MockCtx);
  if (!ctx) throw new Error("useMock outside MockProvider");
  return ctx;
}
