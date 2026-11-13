const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const TZ = "Asia/Tashkent";

function parts(iso: string) {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  return { y: get("year"), m: Number(get("month")), d: Number(get("day")), hh: get("hour"), mm: get("minute") };
}

/** "13-noyabr, 2026-yil" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d}-${MONTHS[m - 1]}, ${y}-yil`;
  }
  const p = parts(iso);
  return `${p.d}-${MONTHS[p.m - 1]}, ${p.y}-yil`;
}

/** "13-noyabr, 2026 · 18:30" (Tashkent time) */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const p = parts(iso);
  return `${p.d}-${MONTHS[p.m - 1]}, ${p.y} · ${p.hh}:${p.mm}`;
}

export function dateBadge(iso: string) {
  const p = parts(iso);
  return { day: String(p.d), month: MONTHS_SHORT[p.m - 1], time: `${p.hh}:${p.mm}` };
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n).replace(/,/g, " ");
}

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDateTime(iso);
}
