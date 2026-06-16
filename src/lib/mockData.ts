// Static mock data for prototype flows. Front-end only.

export type Mock = { id: string; [k: string]: any };

export const MOCK_SITES = [
  { id: "tesis-1", label: "Tesis 1 — İzmit Üretim" },
  { id: "tesis-2", label: "Tesis 2 — Gebze Paketleme" },
] as const;

export const MOCK_LOCATIONS = [
  { id: "L1", site: "Tesis 1 — İzmit Üretim", building: "A Blok", floor: "Zemin", area: "Hat 3", room: "Konveyör 7", label: "Tesis 1 / A Blok / Zemin / Hat 3 / Konveyör 7" },
  { id: "L2", site: "Tesis 1 — İzmit Üretim", building: "A Blok", floor: "1. Kat", area: "Dolum", room: "Hat 1", label: "Tesis 1 / A Blok / 1. Kat / Dolum / Hat 1" },
  { id: "L3", site: "Tesis 1 — İzmit Üretim", building: "B Blok", floor: "Zemin", area: "Bakım", room: "Atölye", label: "Tesis 1 / B Blok / Zemin / Bakım / Atölye" },
  { id: "L4", site: "Tesis 2 — Gebze Paketleme", building: "C Blok", floor: "Zemin", area: "Paketleme", room: "Hat 5", label: "Tesis 2 / C Blok / Zemin / Paketleme / Hat 5" },
  { id: "L5", site: "Tesis 2 — Gebze Paketleme", building: "C Blok", floor: "1. Kat", area: "Soğutma", room: "Chiller 2", label: "Tesis 2 / C Blok / 1. Kat / Soğutma / Chiller 2" },
];

export const MOCK_MACHINES = [
  { id: "M1", name: "Konveyör Bandı 7", code: "KNV-007", model: "SiemensConvey 3000", serial: "SC3K-77821", location: "Tesis 1 / A Blok / Hat 3", status: "Çalışıyor", openWork: 1, lastIntervention: "2026-06-10" },
  { id: "M2", name: "Dolum Makinesi 1", code: "DLM-001", model: "FillPro X2", serial: "FP-X2-1042", location: "Tesis 1 / A Blok / Dolum", status: "Bakım", openWork: 0, lastIntervention: "2026-05-30" },
  { id: "M3", name: "Chiller 2", code: "CHL-002", model: "CoolMaster 80", serial: "CM80-220", location: "Tesis 2 / C Blok / Soğutma", status: "Çalışıyor", openWork: 0, lastIntervention: "2026-04-21" },
  { id: "M4", name: "Paketleme Robotu 5", code: "RBT-005", model: "PackBot 5R", serial: "PB5R-9981", location: "Tesis 2 / C Blok / Paketleme", status: "Uyarı", openWork: 2, lastIntervention: "2026-06-12" },
  { id: "M5", name: "Hidrolik Pres 2", code: "HPR-002", model: "PressureLine 200t", serial: "PL200-554", location: "Tesis 1 / B Blok / Atölye", status: "Çalışıyor", openWork: 0, lastIntervention: "2026-03-15" },
];

export const MOCK_RECENT_MACHINES = ["M1", "M4", "M2"];

export const MOCK_PARTS = [
  { id: "P1", name: "Kaplin 30mm", code: "KPL-030", stock: 4 },
  { id: "P2", name: "V-Kayış SPB 1800", code: "VKS-1800", stock: 12 },
  { id: "P3", name: "Rulman 6204-2RS", code: "RUL-6204", stock: 28 },
  { id: "P4", name: "Hidrolik Filtre HF-21", code: "HF-21", stock: 6 },
  { id: "P5", name: "Sensör SICK WTB4", code: "SCK-WTB4", stock: 2 },
];

export const MOCK_SIMILAR_CASES = [
  { id: "C1", code: "ARZ-1842", similarity: 0.92, sameMachine: true, machine: "Konveyör Bandı 7", symptom: "Yüksek titreşim ve ses", rootCause: "Kaplin hizasızlığı", intervention: "Kaplin yeniden hizalandı, cıvatalar tork değerinde sıkıldı", parts: ["Kaplin 30mm"], result: "Titreşim 0.8 mm/s'e düştü", date: "2026-04-12" },
  { id: "C2", code: "ARZ-1701", similarity: 0.78, sameMachine: false, machine: "Konveyör Bandı 4 (aynı model)", symptom: "Bant kayması ve titreşim", rootCause: "Gergi mekanizması gevşek", intervention: "Gergi vidası ayarlandı", parts: [], result: "Sorun giderildi", date: "2026-02-08" },
  { id: "C3", code: "ARZ-1655", similarity: 0.64, sameMachine: false, machine: "Konveyör Bandı 7", symptom: "Tahrik motoru gürültüsü", rootCause: "Rulman aşınması", intervention: "Rulman değiştirildi", parts: ["Rulman 6204-2RS"], result: "Normal", date: "2026-01-22" },
];

export const MOCK_DOCS = [
  { id: "D1", title: "Konveyör Bakım Kılavuzu", section: "s.42 — Kaplin hizalama prosedürü", url: "#" },
  { id: "D2", title: "SiemensConvey 3000 Servis El Kitabı", section: "Bölüm 7 — Titreşim limitleri", url: "#" },
  { id: "D3", title: "İSG Talimatı", section: "T-12 — Dönen ekipmanda etiketle-kilitle", url: "#" },
];

export const MOCK_NOTIFICATIONS = [
  { id: "N1", type: "atama", title: "Yeni iş atandı", body: "ARZ-2014 — Konveyör Bandı 7 titreşim", time: "2 dk önce", unread: true, workId: null },
  { id: "N2", type: "parca", title: "Parça talebi onaylandı", body: "Kaplin 30mm depodan ayrıldı", time: "1 sa önce", unread: true },
  { id: "N3", type: "uzman", title: "Uzman yanıt verdi", body: "Mehmet B.: Ölçüm değerini paylaşır mısın?", time: "3 sa önce", unread: false },
  { id: "N4", type: "oncelik", title: "Öncelik değişti", body: "BKM-1882 → Yüksek", time: "Dün", unread: false },
  { id: "N5", type: "sync", title: "Senkronizasyon tamamlandı", body: "3 kayıt başarıyla yüklendi", time: "Dün", unread: false },
  { id: "N6", type: "geri", title: "Kapanış geri gönderildi", body: "ARZ-1990 — Son durum ölçümü eksik", time: "2 gün önce", unread: false },
];

export const MOCK_ASSIGNED_META = {
  assignedBy: "Vardiya Amiri • Selim K.",
  team: "Mekanik Bakım Ekibi",
  priority: "Yüksek",
  plannedAt: "Bugün 14:30",
  request: "Operatör konveyör bandında anormal titreşim ve ses olduğunu bildirdi. Üretim devam ediyor ancak fire artıyor.",
  attachments: ["operator-note.jpg", "shift-report.pdf"],
  relatedRecords: [{ code: "ARZ-1842", title: "Konveyör titreşimi — Kaplin hizalandı", date: "2026-04-12" }],
};

export const MOCK_DIAGNOSTIC_STEPS = [
  {
    id: "S1",
    title: "Önce kaplin hizasını kontrol edin",
    reason: "Yüksek ses ve titreşim birlikte görüldüğünde önerilen ilk kontroldür.",
    sources: [{ doc: "Bakım Kılavuzu", section: "s.42" }, { doc: "Benzer kayıt", section: "İş Emri #1842" }],
    confidence: 0.88,
    safety: "Kontrolden önce makineyi etiketleyip kilitleyin.",
  },
  {
    id: "S2",
    title: "Tahrik kayışı gerginliğini ölçün",
    reason: "Kaplin normalse, ikinci en sık neden kayış gerginliğidir.",
    sources: [{ doc: "Servis El Kitabı", section: "Bölüm 7" }],
    confidence: 0.71,
  },
  {
    id: "S3",
    title: "Rulman sıcaklığını ölçün",
    reason: "Önceki iki kontrol normalse, rulman aşınması ihtimali artar.",
    sources: [{ doc: "Benzer kayıt", section: "İş Emri #1655" }],
    confidence: 0.58,
  },
];

export const MOCK_HISTORY_INSIGHT = {
  openCount: 1,
  lastFailure: "2026-06-10 — Yüksek titreşim",
  lastMaintenance: "2026-05-22 — Periyodik kontrol",
  records90d: 5,
  recurringSymptom: "Yüksek titreşim",
  topRootCause: "Kaplin hizasızlığı",
  recentParts: ["Kaplin 30mm", "Rulman 6204-2RS"],
  avgInterval: "≈ 21 gün",
  openFollowUps: ["Titreşim trendinin 14 gün boyunca izlenmesi"],
  insight: "Son 90 günde 3 yüksek titreşim kaydı oluştu. İki kayıtta kaplin hizasızlığı tespit edildi.",
};

export const QUICK_RECORDING_PHRASES = [
  "Konveyör 7'de yüksek titreşim duydum, ses var.",
  "Kaplin gözle baktım, eksantrik görünüyor.",
  "Kaplin hizasını yeniden ayarladım ve cıvataları torkladım.",
  "Çalıştırdım, titreşim normale döndü.",
];
