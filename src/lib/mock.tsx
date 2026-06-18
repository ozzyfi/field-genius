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
  relation: "olusturuldu" | "bagli_ariza" | "takip" | "tekrar_test" | "parca_talebi";
  at: string;
};

export type SupportCategory = "parca" | "uzman" | "ekip" | "erisim" | "tekraryok" | "vardiya";

export type SupportRequest = {
  category: SupportCategory;
  body: Record<string, any>;
  waitingSince: string;
  timeline: { at: string; text: string }[];
  resolved?: boolean;
  resolvedAt?: string;
  resolution?: Record<string, any>;
  interruptedStepId?: string;
};

export type WorkflowStatus =
  | "atanmis"
  | "kabul_bekliyor"
  | "devam_ediyor"
  | "destek_bekliyor"
  | "blokeli"
  | "kismi_tamamlandi"
  | "devreye_alma_bekliyor"
  | "kapanis_kontrolu"
  | "tamamlandi"
  | "iptal";

export type DraftMachine = { id: string; name: string; code?: string; model?: string; serial?: string; location?: string };

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
  lastSavedAt: number;

  // machine + location (front-end source of truth, also synced to backend when possible)
  machine?: DraftMachine | null;
  workLocation?: string | null;

  // planning
  plannedAt?: string | null; // ISO
  immediate?: boolean;

  // workflow
  workflowStatus?: WorkflowStatus;
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
  decline?: { reason: string; note?: string; evidence?: string[]; at: string };
  transfer?: { receiver: string; state?: string; note?: string; evidence?: string[]; nextStep?: string; at: string };

  // support
  support?: SupportRequest | null;

  // completion gating
  blocked?: boolean;
  blockReason?: string;
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

  // per-record dirty + global helper for back-compat
  dirty: boolean;
  setDirty: (v: boolean) => void;
  isDirty: (workId: string) => boolean;
  markDirty: (workId: string) => void;
  clearDirty: (workId: string) => void;
  anyDirty: () => boolean;

  drafts: Record<string, WorkDraft>;
  getDraft: (workId: string) => WorkDraft | undefined;
  updateDraft: (workId: string, patch: Partial<WorkDraft>) => void;
  clearDraft: (workId: string) => void;
  discardDraft: (workId: string) => void;
  saveDraftSnapshot: (workId: string) => void;
  restoreDraftSnapshot: (workId: string) => boolean;

  startWorkflow: (workId: string, type: WorkDraft["workType"]) => void;
  setStep: (workId: string, stepId: string) => void;
  markStepDone: (workId: string, stepId: string) => void;

  // support helpers
  openSupport: (workId: string, req: Omit<SupportRequest, "waitingSince" | "timeline" | "resolved">) => void;
  resolveSupport: (workId: string, resolution: { label: string } & Record<string, any>) => void;

  // completed snapshots (kept after closing)
  completedSnapshots: Record<string, WorkDraft>;
  snapshotCompleted: (workId: string) => void;
  getCompleted: (workId: string) => WorkDraft | undefined;

  linkedRecords: LinkedRecord[];
  addLinkedRecord: (r: Omit<LinkedRecord, "id" | "at">) => LinkedRecord;
  linksFor: (workId: string) => LinkedRecord[];
};

const MockCtx = createContext<Ctx | null>(null);

const DRAFTS_KEY = "toola.drafts.v3";
const LINKS_KEY = "toola.links.v1";
const SNAPSHOTS_KEY = "toola.snapshots.v1";
const COMPLETED_KEY = "toola.completed.v1";

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
  const [drafts, setDrafts] = useState<Record<string, WorkDraft>>({});
  const [snapshots, setSnapshots] = useState<Record<string, WorkDraft>>({});
  const [completedSnapshots, setCompletedSnapshots] = useState<Record<string, WorkDraft>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecord[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setDrafts(loadJSON<Record<string, WorkDraft>>(DRAFTS_KEY, {}));
    setSnapshots(loadJSON<Record<string, WorkDraft>>(SNAPSHOTS_KEY, {}));
    setCompletedSnapshots(loadJSON<Record<string, WorkDraft>>(COMPLETED_KEY, {}));
    setLinkedRecords(loadJSON<LinkedRecord[]>(LINKS_KEY, []));
    hydrated.current = true;
  }, []);

  useEffect(() => { if (hydrated.current) try { window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch {} }, [drafts]);
  useEffect(() => { if (hydrated.current) try { window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots)); } catch {} }, [snapshots]);
  useEffect(() => { if (hydrated.current) try { window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedSnapshots)); } catch {} }, [completedSnapshots]);
  useEffect(() => { if (hydrated.current) try { window.localStorage.setItem(LINKS_KEY, JSON.stringify(linkedRecords)); } catch {} }, [linkedRecords]);

  const markAllRead = useCallback(() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false }))), []);
  const toggleRead = useCallback((id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))), []);
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const markDirty = useCallback((workId: string) => setDirtyMap((d) => ({ ...d, [workId]: true })), []);
  const clearDirty = useCallback((workId: string) => setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; }), []);
  const isDirty = useCallback((workId: string) => !!dirtyMap[workId], [dirtyMap]);
  const anyDirty = useCallback(() => Object.values(dirtyMap).some(Boolean), [dirtyMap]);
  const [globalDirty, setGlobalDirty] = useState(false);

  const getDraft = useCallback((workId: string) => drafts[workId], [drafts]);
  const updateDraft = useCallback((workId: string, patch: Partial<WorkDraft>) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      return { ...d, [workId]: { ...cur, ...patch, lastSavedAt: Date.now() } };
    });
    setDirtyMap((d) => ({ ...d, [workId]: true }));
  }, []);
  const clearDraftFn = useCallback((workId: string) => {
    setDrafts((d) => { const n = { ...d }; delete n[workId]; return n; });
    setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; });
  }, []);
  const discardDraft = useCallback((workId: string) => {
    const snap = snapshots[workId];
    if (snap) {
      setDrafts((d) => ({ ...d, [workId]: snap }));
    } else {
      setDrafts((d) => { const n = { ...d }; delete n[workId]; return n; });
    }
    setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; });
  }, [snapshots]);
  const saveDraftSnapshot = useCallback((workId: string) => {
    setDrafts((d) => {
      const cur = d[workId];
      if (!cur) return d;
      const stamped = { ...cur, lastSavedAt: Date.now() };
      setSnapshots((s) => ({ ...s, [workId]: stamped }));
      return { ...d, [workId]: stamped };
    });
    setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; });
  }, []);
  const restoreDraftSnapshot = useCallback((workId: string) => {
    const snap = snapshots[workId];
    if (!snap) return false;
    setDrafts((d) => ({ ...d, [workId]: snap }));
    setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; });
    return true;
  }, [snapshots]);

  const startWorkflow = useCallback((workId: string, type: WorkDraft["workType"]) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      return { ...d, [workId]: { ...cur, workType: type, accepted: true, workflowStatus: cur.workflowStatus ?? "devam_ediyor", lastSavedAt: Date.now() } };
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

  const openSupport = useCallback((workId: string, req: Omit<SupportRequest, "waitingSince" | "timeline" | "resolved">) => {
    setDrafts((d) => {
      const cur = d[workId] ?? { workId, step: 0, evidence: [], lastSavedAt: Date.now() };
      const now = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      const support: SupportRequest = {
        ...req,
        interruptedStepId: req.interruptedStepId ?? cur.currentStepId,
        waitingSince: now,
        timeline: [{ at: "Şimdi", text: "Destek talebi oluşturuldu" }],
      };
      return { ...d, [workId]: { ...cur, support, workflowStatus: "destek_bekliyor", lastSavedAt: Date.now() } };
    });
    setDirtyMap((d) => ({ ...d, [workId]: true }));
  }, []);

  const resolveSupport = useCallback((workId: string, resolution: { label: string } & Record<string, any>) => {
    setDrafts((d) => {
      const cur = d[workId];
      if (!cur?.support) return d;
      const at = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      const support: SupportRequest = {
        ...cur.support,
        resolved: true,
        resolvedAt: at,
        resolution,
        timeline: [{ at: "Şimdi", text: `${resolution.label} — işe devam edildi` }, ...cur.support.timeline],
      };
      const restoreStep = cur.support.interruptedStepId ?? cur.currentStepId;
      return { ...d, [workId]: { ...cur, support, currentStepId: restoreStep, workflowStatus: "devam_ediyor", lastSavedAt: Date.now() } };
    });
  }, []);

  const snapshotCompleted = useCallback((workId: string) => {
    setDrafts((d) => {
      const cur = d[workId];
      if (!cur) return d;
      setCompletedSnapshots((cs) => ({ ...cs, [workId]: { ...cur, workflowStatus: "tamamlandi" } }));
      const n = { ...d };
      delete n[workId];
      return n;
    });
    setSnapshots((s) => { const n = { ...s }; delete n[workId]; return n; });
    setDirtyMap((d) => { const n = { ...d }; delete n[workId]; return n; });
  }, []);
  const getCompleted = useCallback((workId: string) => completedSnapshots[workId], [completedSnapshots]);

  const addLinkedRecord = useCallback((r: Omit<LinkedRecord, "id" | "at">) => {
    const full: LinkedRecord = { ...r, id: `lr-${Date.now()}`, at: new Date().toLocaleString("tr-TR") };
    setLinkedRecords((arr) => [full, ...arr]);
    return full;
  }, []);

  const linksFor = useCallback((workId: string) => linkedRecords.filter((l) => l.fromWorkId === workId || l.toWorkId === workId), [linkedRecords]);

  useEffect(() => {
    if (sync !== "syncing") return;
    const t = setTimeout(() => { setSync("online"); setPendingCount(0); }, 1800);
    return () => clearTimeout(t);
  }, [sync]);

  const value: Ctx = {
    focus, setFocus,
    sync, setSync, pendingCount, setPendingCount,
    notifications, markAllRead, toggleRead, unreadCount,
    dirty: globalDirty || anyDirty(),
    setDirty: setGlobalDirty,
    isDirty, markDirty, clearDirty, anyDirty,
    drafts, getDraft, updateDraft, clearDraft: clearDraftFn, discardDraft,
    saveDraftSnapshot, restoreDraftSnapshot,
    startWorkflow, setStep, markStepDone,
    openSupport, resolveSupport,
    completedSnapshots, snapshotCompleted, getCompleted,
    linkedRecords, addLinkedRecord, linksFor,
  };
  return <MockCtx.Provider value={value}>{children}</MockCtx.Provider>;
}

export function useMock() {
  const ctx = useContext(MockCtx);
  if (!ctx) throw new Error("useMock outside MockProvider");
  return ctx;
}
