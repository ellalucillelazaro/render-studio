import { useEffect, useRef, useState } from "react";
import { SectionHeader, Btn, Banner } from "./primitives";
import type { DrawingType, SheetRow, UploadedFile } from "@/lib/studio-types";
import { extractPdf, pingBackend, toAbsolute, API_BASE } from "@/lib/studio-api";

interface Props {
  files: UploadedFile[];
  sheets: SheetRow[];
  onFiles: (f: UploadedFile[]) => void;
  onSheets: (s: SheetRow[]) => void;
  onUseSheet: (s: SheetRow) => void;
}

type BackendStatus = "checking" | "online" | "offline";

export function ExtractTab({ files, sheets, onFiles, onSheets, onUseSheet }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [backend, setBackend] = useState<BackendStatus>("checking");

  async function refreshBackend() {
    setBackend("checking");
    setBackend((await pingBackend()) ? "online" : "offline");
  }

  useEffect(() => {
    refreshBackend();
  }, []);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next: UploadedFile[] = [];
    const newImageSheets: SheetRow[] = [];
    const pdfFiles: File[] = [];

    Array.from(list).forEach((file, idx) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImg = file.type.startsWith("image/");
      if (!isPdf && !isImg) return;

      const url = URL.createObjectURL(file);
      const uf: UploadedFile = {
        id: `${Date.now()}-${idx}-${file.name}`,
        name: file.name,
        size: file.size,
        kind: isPdf ? "pdf" : "image",
        url,
      };
      next.push(uf);

      if (isPdf) {
        pdfFiles.push(file);
      } else {
        newImageSheets.push({
          id: uf.id,
          sourceFile: file.name,
          sheetNumber: inferSheetNumber(file.name) ?? `IMG-${sheets.length + newImageSheets.length + 1}`,
          title: stripExt(file.name),
          drawingType: "Unknown",
          thumbnailUrl: url,
        });
      }
    });

    onFiles([...files, ...next]);
    let accumulated = [...sheets, ...newImageSheets];
    if (newImageSheets.length) onSheets(accumulated);

    if (pdfFiles.length === 0) return;

    setPdfError(null);
    setPdfLoading(true);
    try {
      for (const pdf of pdfFiles) {
        setCurrentPdf(pdf.name);
        const dtos = await extractPdf(pdf);
        const rows: SheetRow[] = dtos.map((d) => ({
          id: `${pdf.name}::${d.id}`,
          sourceFile: pdf.name,
          sheetNumber: d.sheet,
          title: d.title,
          drawingType: (d.type as DrawingType) ?? "Unknown",
          thumbnailUrl: toAbsolute(d.preview_url),
        }));
        accumulated = [...accumulated, ...rows];
        onSheets(accumulated);
      }
      setBackend("online");
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF extraction failed");
      setBackend("offline");
    } finally {
      setPdfLoading(false);
      setCurrentPdf(null);
    }
  }

  const pdfCount = files.filter((f) => f.kind === "pdf").length;
  const imgCount = files.filter((f) => f.kind === "image").length;

  return (
    <div>
      <SectionHeader
        num="01"
        title="Extract Drawings"
        subtitle="Upload full construction sets or individual sheet exports. The studio detects the file type and surfaces every sheet for review."
        right={<BackendBadge status={backend} onRetry={refreshBackend} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-10">
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer border hairline aspect-[16/7] flex flex-col items-center justify-center text-center px-6 transition-colors ${
              dragOver ? "bg-muted" : "bg-background hover:bg-muted/40"
            }`}
            style={dragOver ? { borderColor: "var(--sga-red)" } : undefined}
          >
            <div className="label-eyebrow mb-4">Drop / Browse</div>
            <div className="font-display text-[28px] sm:text-[32px] md:text-[44px] leading-tight max-w-xl">
              Drop a construction set or sheet exports here
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              PDF · PNG · JPG &nbsp;—&nbsp; multi-file supported
            </div>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {(pdfCount > 0 || imgCount > 0) && (
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 label-eyebrow">
              <span>{files.length} file{files.length === 1 ? "" : "s"}</span>
              <span>· {pdfCount} PDF</span>
              <span>· {imgCount} Image</span>
              <span>· {sheets.length} sheet{sheets.length === 1 ? "" : "s"} ready</span>
            </div>
          )}

          {pdfLoading && (
            <div className="mt-6 border hairline px-5 py-4 bg-muted/40 flex items-center gap-4">
              <Spinner />
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Extracting via POST /extract-pdf</div>
                <div className="text-sm truncate">{currentPdf}</div>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="mt-6">
              <Banner tone="warning" title="PDF extraction unavailable">
                {pdfError}. Image uploads are still previewed locally — PDF page extraction
                requires the backend at <span className="font-mono">{API_BASE}</span>.
                Endpoint: <span className="font-mono">POST /extract-pdf</span>.
              </Banner>
            </div>
          )}

          {!pdfLoading && !pdfError && backend === "offline" && pdfCount > 0 && (
            <div className="mt-6">
              <Banner tone="warning" title="Backend offline — PDFs queued locally">
                The conversion service at <span className="font-mono">{API_BASE}</span> is not reachable.
                Your uploaded files are preserved. Start the backend, then re-drop the PDFs
                to extract sheets.
              </Banner>
            </div>
          )}
        </div>

        <aside>
          <div className="flex items-center justify-between mb-4">
            <div className="label-eyebrow">Uploaded — {files.length}</div>
            {files.length > 0 && (
              <button
                onClick={() => onFiles([])}
                className="label-eyebrow hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          {files.length === 0 ? (
            <div className="text-sm text-muted-foreground border hairline p-5">
              Nothing uploaded yet.
            </div>
          ) : (
            <ul className="border hairline divide-y divide-[color:var(--border)] max-h-[420px] overflow-y-auto">
              {files.map((f) => (
                <li key={f.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 border hairline overflow-hidden bg-muted shrink-0">
                    {f.kind === "image" ? (
                      <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center font-mono text-[9px]" style={{ color: "var(--sga-red)" }}>
                        PDF
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{f.name}</div>
                    <div className="label-eyebrow !text-[9px] mt-1">
                      {f.kind.toUpperCase()} · {(f.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="mt-16">
        <div className="flex items-end justify-between mb-6 pb-4 border-b hairline gap-4 flex-wrap">
          <div>
            <div className="label-eyebrow mb-2">— Extracted Sheets</div>
            <h3 className="font-display text-[28px] md:text-[36px]">
              {sheets.length} drawing{sheets.length === 1 ? "" : "s"}
            </h3>
          </div>
          {sheets.length > 0 && (
            <Btn variant="ghost" onClick={() => onSheets([])}>
              Clear All
            </Btn>
          )}
        </div>

        {sheets.length === 0 ? (
          <div className="border hairline p-10 md:p-16 text-center">
            <div className="font-display text-[22px] md:text-[28px] leading-tight max-w-md mx-auto">
              Sheets will appear here after upload.
            </div>
            <div className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              Image uploads are surfaced immediately. PDFs are routed through
              the conversion backend.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sheets.map((s, i) => (
              <SheetCard key={s.id} sheet={s} index={i + 1} onUse={() => onUseSheet(s)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SheetCard({
  sheet,
  index,
  onUse,
}: {
  sheet: SheetRow;
  index: number;
  onUse: () => void;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <article className="border hairline bg-background group flex flex-col">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden border-b hairline">
        {sheet.thumbnailUrl && !broken ? (
          <img
            src={sheet.thumbnailUrl}
            alt={sheet.title}
            onError={() => setBroken(true)}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center label-eyebrow">
            Preview unavailable
          </div>
        )}
        <div className="absolute top-3 left-3 font-mono text-[10px] tracking-widest px-2 py-1 bg-background/90 border hairline">
          {String(index).padStart(2, "0")}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-mono text-[12px] tracking-widest" style={{ color: "var(--sga-red)" }}>
            {sheet.sheetNumber}
          </div>
          <div className="label-eyebrow !text-[9px]">{sheet.drawingType}</div>
        </div>
        <div className="font-display text-[20px] leading-tight line-clamp-2">{sheet.title}</div>
        <div className="label-eyebrow !text-[9px] truncate mt-auto">{sheet.sourceFile}</div>
        <Btn variant="accent" onClick={onUse} className="!h-10 w-full">
          Use Sheet →
        </Btn>
      </div>
    </article>
  );
}

function BackendBadge({ status, onRetry }: { status: BackendStatus; onRetry: () => void }) {
  const map = {
    checking: { label: "Checking backend…", color: "var(--muted-foreground)" },
    online: { label: "Backend online", color: "oklch(0.55 0.15 145)" },
    offline: { label: "Backend offline", color: "var(--sga-red)" },
  } as const;
  const m = map[status];
  return (
    <button
      onClick={onRetry}
      title={`${API_BASE} — click to retry`}
      className="inline-flex items-center gap-2 px-3 h-9 border hairline font-mono text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
    >
      <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
      {m.label}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
      style={{ borderColor: "var(--border)", borderTopColor: "var(--sga-red)" }}
    />
  );
}

function stripExt(n: string) {
  return n.replace(/\.[^.]+$/, "");
}
function inferSheetNumber(n: string): string | null {
  const m = n.match(/([A-Z]{1,2}-?\d{2,4}(?:\.\d+)?)/i);
  return m ? m[1].toUpperCase() : null;
}
