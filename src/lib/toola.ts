// Shared labels & helpers (Turkish)
export const WORK_TYPE_LABEL: Record<string, string> = {
  ariza: "Arıza",
  bakim: "Bakım",
  test: "Test / Kontrol",
  kurulum: "Kurulum",
  parca: "Parça Değişimi",
  diger: "Diğer",
};

export const STATUS_LABEL: Record<string, string> = {
  beklemede: "Bekliyor",
  devam_ediyor: "Devam ediyor",
  kapanis_eksik: "Kapanış eksik",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const PRIORITY_LABEL: Record<string, string> = {
  dusuk: "Düşük",
  normal: "Normal",
  yuksek: "Yüksek",
  kritik: "Kritik",
};

export const SOURCE_LABEL: Record<string, string> = {
  atanan: "Atanan iş",
  teknisyen: "Saha kaydı",
};

export function statusPillClass(s: string): string {
  switch (s) {
    case "tamamlandi":
      return "pill pill-success";
    case "devam_ediyor":
      return "pill pill-primary";
    case "kapanis_eksik":
      return "pill pill-warning";
    case "iptal":
      return "pill pill-danger";
    default:
      return "pill";
  }
}

export function priorityPillClass(p: string): string {
  switch (p) {
    case "kritik":
      return "pill pill-danger";
    case "yuksek":
      return "pill pill-warning";
    default:
      return "pill";
  }
}

export function genWorkCode(type: string) {
  const prefix =
    type === "ariza" ? "ARZ" :
    type === "bakim" ? "BKM" :
    type === "test" ? "TST" :
    type === "kurulum" ? "KRL" :
    type === "parca" ? "PRC" : "DGR";
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

export function formatDateTr(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}
