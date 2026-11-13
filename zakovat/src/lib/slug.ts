const MAP: Record<string, string> = { "ʻ": "", "ʼ": "", "'": "", "‘": "", "’": "", "`": "", ш: "sh", ч: "ch", ю: "yu", я: "ya", ё: "yo", ж: "j", ц: "s", щ: "sh", х: "x", ғ: "g", қ: "q", ҳ: "h", ў: "o" };
const CYR = "абвгдезийклмнопрстуфыэ";
const LAT = "abvgdeziyklmnoprstufie";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? (CYR.includes(ch) ? LAT[CYR.indexOf(ch)] : ch))
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
