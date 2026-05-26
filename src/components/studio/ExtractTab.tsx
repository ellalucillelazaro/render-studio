import { useEffect, useRef, useState } from "react";
import { SectionHeader, SectionBar, Vitrine, Btn, Banner } from "./primitives";
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

      {/* Vitrine drop zone — hero plate */}
      <Vitrine className="mb-4">
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
          className={`cursor-pointer flex flex-col items-center justify-center text-center px-8 py-16 md:py-24 transition-colors ${
            dragOver ? "bg-muted" : "hover:bg-background"
          }`}
        >
          <div className="label-eyebrow mb-6">Drop / Browse</div>
          <h3 className="font-display text-[28px] sm:text-[36px] md:text-[48px] leading-[1.05] max-w-[640px]">
            Drop a construction set or sheet exports here
          </h3>
          <div className="h-px w-10 my-7" style={{ backgroundColor: "var(--sga-red)" }} />
          <div className="label-eyebrow !text-[9px]">PDF · PNG · JPG — Multi-file supported</div>
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </Vitrine>

      {/* Live counters under vitrine */}
      {(pdfCount > 0 || imgCount > 0) && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-6 label-eyebrow !text-[9px]">
          <span>{files.length} file{files.length === 1 ? "" : "s"}</span>
          <span className="opacity-30">·</span>
          <span>{pdfCount} PDF</span>
          <span className="opacity-30">·</span>
          <span>{imgCount} Image</span>
          <span className="opacity-30">·</span>
          <span>{sheets.length} sheet{sheets.length === 1 ? "" : "s"} ready</span>
        </div>
      )}

      {pdfLoading && (
        <div className="mt-8 surface border hairline px-5 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <Spinner />
          <div className="min-w-0">
            <div className="label-eyebrow mb-1">Extracting via POST /extract-pdf</div>
            <div className="text-sm truncate">{currentPdf}</div>
          </div>
        </div>
      )}

      {pdfError && (
        <div className="mt-8 max-w-2xl mx-auto">
          <Banner tone="warning" title="PDF extraction unavailable">
            {pdfError}. Image uploads are still previewed locally — PDF page extraction
            requires the backend at <span className="font-mono">{API_BASE}</span>.
            Endpoint: <span className="font-mono">POST /extract-pdf</span>.
          </Banner>
        </div>
      )}

      {!pdfLoading && !pdfError && backend === "offline" && pdfCount > 0 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <Banner tone="warning" title="Backend offline — PDFs queued locally">
            The conversion service at <span className="font-mono">{API_BASE}</span> is not reachable.
            Your uploaded files are preserved. Start the backend, then re-drop the PDFs to extract sheets.
          </Banner>
        </div>
      )}

      {/* Uploaded files */}
      <section className="mt-20">
        <SectionBar
          label={`Uploaded — ${String(files.length).padStart(2, "0")}`}
          meta={files.length > 0 ? `${files.length} item${files.length === 1 ? "" : "s"}` : undefined}
          action={
            files.length > 0 ? (
              <button
                onClick={() => onFiles([])}
                className="label-eyebrow hover:text-foreground transition-colors"
              >
                Reset
              </button>
            ) : undefined
          }
        />
        {files.length === 0 ? (
          <div className="border hairline surface py-10 text-center">
            <p className="font-display italic text-[15px] text-muted-foreground">
              Nothing uploaded yet.
            </p>
          </div>
        ) : (
          <ul className="border hairline divide-y divide-[color:var(--border)]">
            {files.map((f) => (
              <li key={f.id} className="px-5 py-3 flex items-center gap-4 bg-background">
                <div className="w-10 h-10 border hairline overflow-hidden surface shrink-0">
                  {f.kind === "image" ? (
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full grid place-items-center font-mono text-[9px] tracking-widest"
                      style={{ color: "var(--sga-red)" }}
                    >
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
      </section>

      {/* Extracted sheets */}
      <section className="mt-20">
        <SectionBar
          label="— Extracted Sheets"
          meta={`${sheets.length} drawing${sheets.length === 1 ? "" : "s"}`}
          action={
            sheets.length > 0 ? (
              <button
                onClick={() => onSheets([])}
                className="label-eyebrow hover:text-foreground transition-colors"
              >
                Clear
              </button>
            ) : undefined
          }
        />

        {sheets.length === 0 ? (
          <div className="border hairline surface py-16 md:py-24 text-center px-6">
            <p className="font-display italic text-[22px] md:text-[26px] leading-tight max-w-md mx-auto mb-4">
              Sheets will appear here after upload.
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground max-w-sm mx-auto">
              Image uploads are surfaced immediately. PDFs are routed through the conversion backend.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheets.map((s, i) => (
              <SheetPlate key={s.id} sheet={s} index={i + 1} onUse={() => onUseSheet(s)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SheetPlate({
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
    <article className="group">
      <Vitrine>
        <div className="relative aspect-[4/3] overflow-hidden">
          {sheet.thumbnailUrl && !broken ? (
            <img
              src={sheet.thumbnailUrl}
              alt={sheet.title}
              onError={() => setBroken(true)}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full grid place-items-center label-eyebrow">
              Preview unavailable
            </div>
          )}
          <div className="absolute top-2 left-2 font-mono text-[9px] tracking-widest px-1.5 py-0.5 bg-background/95 border hairline">
            PLT · {String(index).padStart(2, "0")}
          </div>
        </div>
      </Vitrine>
      <div className="pt-4 px-1">
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: "var(--sga-red)" }}>
            {sheet.sheetNumber}
          </div>
          <div className="label-eyebrow !text-[9px]">{sheet.drawingType}</div>
        </div>
        <h4 className="font-display text-[22px] leading-[1.15] line-clamp-2 mb-2">{sheet.title}</h4>
        <div className="label-eyebrow !text-[9px] truncate mb-4">{sheet.sourceFile}</div>
        <button
          onClick={onUse}
          className="w-full text-left flex items-center justify-between border-t hairline pt-3 font-mono text-[10px] tracking-[0.22em] uppercase hover:text-[color:var(--sga-red)] transition-colors"
        >
          <span>Use Sheet</span>
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

function BackendBadge({ status, onRetry }: { status: BackendStatus; onRetry: () => void }) {
  const map = {
    checking: { label: "Checking backend", color: "var(--muted-foreground)", pulse: true },
    online: { label: "Backend online", color: "oklch(0.55 0.15 145)", pulse: false },
    offline: { label: "Backend offline", color: "var(--sga-red)", pulse: false },
  } as const;
  const m = map[status];
  return (
    <button
      onClick={onRetry}
      title={`${API_BASE} — click to retry`}
      className="inline-flex items-center gap-2 px-3 h-8 border hairline font-mono text-[9px] tracking-[0.22em] uppercase hover:border-foreground transition-colors"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${m.pulse ? "animate-pulse" : ""}`}
        style={{ background: m.color }}
      />
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
