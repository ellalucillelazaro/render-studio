import { useRef, useState } from "react";
import { SectionHeader, Btn, Pill, Toggle, Banner } from "./primitives";
import type { CleanupOptions, CleanupStrength, SheetRow } from "@/lib/studio-types";
import { DEFAULT_CLEANUP } from "@/lib/studio-types";
import { cleanImage, API_BASE } from "@/lib/studio-api";

interface Props {
  activeSheet: SheetRow | null;
  setActiveSheet: (s: SheetRow | null) => void;
}

export function CleanTab({ activeSheet, setActiveSheet }: Props) {
  const [opts, setOpts] = useState<CleanupOptions>(DEFAULT_CLEANUP);
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function ingestFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setUploadedFile(f);
    setActiveSheet({
      id: `direct-${Date.now()}`,
      sourceFile: f.name,
      sheetNumber: "—",
      title: f.name.replace(/\.[^.]+$/, ""),
      drawingType: "Unknown",
      thumbnailUrl: url,
    });
    setCleaned(null);
    setError(null);
  }

  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    ingestFile(files[0]);
  }

  function setOpt<K extends keyof CleanupOptions>(k: K, v: CleanupOptions[K]) {
    setOpts((p) => ({ ...p, [k]: v }));
  }

  async function runClean() {
    if (!activeSheet?.thumbnailUrl) return;
    setProcessing(true);
    setError(null);
    setCleaned(null);
    try {
      const url = await cleanImage({
        file: uploadedFile ?? undefined,
        imageUrl: uploadedFile ? undefined : activeSheet.thumbnailUrl,
        options: opts,
      });
      setCleaned(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setProcessing(false);
    }
  }

  async function download() {
    if (!cleaned) return;
    try {
      const res = await fetch(cleaned);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = `${activeSheet?.sheetNumber ?? "sheet"}-cleaned.png`;
      a.click();
      URL.revokeObjectURL(obj);
    } catch {
      window.open(cleaned, "_blank");
    }
  }

  const strengths: CleanupStrength[] = ["Light", "Standard", "Aggressive"];
  const activeOptCount = [
    opts.removeDimensions,
    opts.removeLabels,
    opts.removeTitleBlock,
    opts.removeCallouts,
    opts.removeHatch,
    opts.cleanLinework,
    opts.sharpen,
    opts.cropCenter,
  ].filter(Boolean).length;

  return (
    <div>
      <SectionHeader
        num="02"
        title="Clean + Render"
        subtitle="Strip technical noise from working drawings and prepare a presentation-grade base for rendering."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => inputRef.current?.click()}>
              Upload Image
            </Btn>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept="image/png,image/jpeg"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">
        <div>
          {!activeSheet ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer border hairline aspect-[16/8] flex flex-col items-center justify-center text-center px-6 transition-colors ${
                dragOver ? "bg-muted" : "bg-background hover:bg-muted/40"
              }`}
              style={dragOver ? { borderColor: "var(--sga-red)" } : undefined}
            >
              <div className="label-eyebrow mb-4">Drop a Drawing</div>
              <div className="font-display text-[26px] md:text-[36px] leading-tight max-w-lg">
                Drop a plan, elevation, or section to begin
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Or pick one from <span className="font-mono">Extract Drawings</span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <PreviewPane
                  label="Before"
                  caption={activeSheet.sheetNumber}
                  img={activeSheet.thumbnailUrl ?? null}
                />
                <PreviewPane
                  label="After"
                  caption={cleaned ? "Cleaned" : processing ? "Processing…" : "Awaiting cleanup"}
                  img={cleaned}
                  processing={processing}
                  tinted
                />
              </div>

              {error && (
                <div className="mt-6">
                  <Banner tone="warning" title="Cleanup failed">
                    {error}. Ensure the backend is running at{" "}
                    <span className="font-mono">{API_BASE}</span> and that{" "}
                    <span className="font-mono">POST /clean-image</span> is reachable.
                    Your source preview is preserved above.
                  </Banner>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t hairline pt-5">
                <div className="min-w-0">
                  <div className="label-eyebrow">Source</div>
                  <div className="text-sm truncate max-w-[420px]">{activeSheet.sourceFile}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="accent" onClick={runClean} disabled={processing}>
                    {processing ? "Cleaning…" : "Clean Drawing"}
                  </Btn>
                  <Btn variant="primary" onClick={download} disabled={!cleaned}>
                    Download Cleaned PNG
                  </Btn>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="border hairline p-5 lg:p-6 self-start lg:sticky lg:top-6">
          <div className="flex items-baseline justify-between mb-5 pb-3 border-b hairline">
            <div className="label-eyebrow">Cleanup Options</div>
            <div className="font-mono text-[10px]" style={{ color: "var(--sga-red)" }}>
              {activeOptCount}/8 active
            </div>
          </div>

          <div className="label-eyebrow !text-[10px] mb-2 text-foreground">Remove</div>
          <Toggle label="Dimensions" checked={opts.removeDimensions} onChange={(v) => setOpt("removeDimensions", v)} />
          <Toggle label="Labels / notes" checked={opts.removeLabels} onChange={(v) => setOpt("removeLabels", v)} />
          <Toggle label="Title block" checked={opts.removeTitleBlock} onChange={(v) => setOpt("removeTitleBlock", v)} />
          <Toggle label="Callouts" checked={opts.removeCallouts} onChange={(v) => setOpt("removeCallouts", v)} />
          <Toggle label="Hatch clutter" checked={opts.removeHatch} onChange={(v) => setOpt("removeHatch", v)} />

          <div className="label-eyebrow !text-[10px] mt-5 mb-2 text-foreground">Enhance</div>
          <Toggle label="Clean linework" checked={opts.cleanLinework} onChange={(v) => setOpt("cleanLinework", v)} />
          <Toggle label="Sharpen image" checked={opts.sharpen} onChange={(v) => setOpt("sharpen", v)} />
          <Toggle label="Crop & center drawing" checked={opts.cropCenter} onChange={(v) => setOpt("cropCenter", v)} />

          <div className="label-eyebrow mt-6 mb-3">Strength</div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s) => (
              <Pill key={s} active={opts.strength === s} onClick={() => setOpt("strength", s)}>
                {s}
              </Pill>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t hairline label-eyebrow !text-[9px] leading-relaxed">
            Sends to <span className="font-mono normal-case">POST {API_BASE}/clean-image</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreviewPane({
  label,
  img,
  caption,
  tinted,
  processing,
}: {
  label: string;
  img: string | null;
  caption?: string;
  tinted?: boolean;
  processing?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="label-eyebrow">{label}</div>
        {caption && <div className="label-eyebrow !text-[9px]">{caption}</div>}
      </div>
      <div
        className={`relative border hairline aspect-[4/3] overflow-hidden ${
          tinted ? "bg-muted/40" : "bg-muted"
        }`}
      >
        {img ? (
          <img src={img} alt={label} className="w-full h-full object-contain" />
        ) : processing ? (
          <ShimmerSkeleton />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {processing && img === null && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-background/90 border hairline px-3 py-2">
            <span
              className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--sga-red)" }}
            />
            <span className="label-eyebrow !text-[9px]">Cleaning drawing…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ShimmerSkeleton() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-muted">
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--sga-red) 6%, transparent) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
