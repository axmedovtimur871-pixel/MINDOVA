import JSZip from "jszip";

interface BatchFiles {
  created_at: string;
  files: { name: string; url: string; row: string[] }[];
}

/** Downloads every PDF of a batch in the browser and saves them as one ZIP. */
export async function downloadBatchZip(batchId: string, onProgress?: (done: number, total: number) => void) {
  const res = await fetch(`/api/admin/batches/${batchId}/files`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Fayllar roʻyxatini olib boʻlmadi");
  const { files, created_at } = json as BatchFiles;

  const zip = new JSZip();
  const used = new Set<string>();
  let done = 0;
  const queue = [...files];
  onProgress?.(0, files.length);
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const f = queue.shift()!;
        let attempt = 0;
        for (;;) {
          try {
            const r = await fetch(f.url);
            if (!r.ok) throw new Error(`${f.name}: ${r.status}`);
            let name = f.name;
            while (used.has(name)) name = name.replace(/\.pdf$/, "-1.pdf");
            used.add(name);
            zip.file(name, await r.arrayBuffer(), { binary: true });
            break;
          } catch (e) {
            if (++attempt >= 3) throw e;
            await new Promise((ok) => setTimeout(ok, 600 * attempt));
          }
        }
        onProgress?.(++done, files.length);
      }
    }),
  );

  const csv = ["Sertifikat raqami;Ism;Familiya;Tadbir;Sana;Holat"]
    .concat(files.map((f) => f.row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")))
    .join("\r\n");
  zip.file("royxat.csv", "﻿" + csv);

  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sertifikatlar-${created_at.slice(0, 10)}-${files.length}ta.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
}
