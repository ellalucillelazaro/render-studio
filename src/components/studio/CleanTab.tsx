import { useRef, useState } from "react";
import { SectionHeader, SectionBar, Vitrine, Btn, Pill, Toggle, Banner } from "./primitives";
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
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 h-8 border hairline font-mono text-[9px] tracking-[0.22em] uppercase hover:border-foreground transition-colors"
          >
            <span className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
            Upload Image
          </button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {!activeSheet ? (
        <Vitrine>
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
            className={`cursor-pointer flex flex-col items-center justify-center text-center px-8 py-16 md:py-24 transition-colors ${
              dragOver ? "bg-muted" : "hover:bg-background"
            }`}
          >
            <div className="label-eyebrow mb-6">Drop a Drawing</div>
            <h3 className="font-display text-[26px] md:text-[40px] leading-[1.05] max-w-lg">
              Drop a plan, elevation, or section to begin
            </h3>
            <div className="h-px w-10 my-7" style={{ backgroundColor: "var(--sga-red)" }} />
            <div className="label-eyebrow !text-[9px]">
              Or pick one from <span className="normal-case">Extract Drawings</span>
            </div>
          </div>
        </Vitrine>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-14">
          <div>
            {/* Before / After plates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <PreviewPlate
                label="Before"
                caption={activeSheet.sheetNumber}
                img={activeSheet.thumbnailUrl ?? null}
                stage="01"
              />
              <PreviewPlate
                label="After"
                caption={cleaned ? "Cleaned" : processing ? "Processing" : "Awaiting cleanup"}
                img={cleaned}
                processing={processing}
                stage="02"
              />
            </div>

            {error && (
              <div className="mt-8">
                <Banner tone="warning" title="Cleanup failed">
                  {error}. Ensure the backend is running at{" "}
                  <span className="font-mono">{API_BASE}</span> and that{" "}
                  <span className="font-mono">POST /clean-image</span> is reachable.
                  Your source preview is preserved above.
                </Banner>
              </div>
            )}

            <div className="mt-10 border-t hairline pt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="label-eyebrow !text-[9px] mb-1">Source</div>
                <div className="font-display text-[18px] truncate max-w-[420px]">
                  {activeSheet.sourceFile}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn variant="accent" onClick={runClean} disabled={processing}>
                  {processing ? "Cleaning…" : "Clean Drawing"}
                </Btn>
                <Btn variant="primary" onClick={download} disabled={!cleaned}>
                  Download PNG
                </Btn>
              </div>
            </div>
          </div>

          {/* Settings sidebar */}
          <aside className="self-start lg:sticky lg:top-28">
            <SectionBar
              label="Cleanup Options"
              meta={
                <span className="font-mono not-italic text-[10px] tracking-widest" style={{ color: "var(--sga-red)" }}>
                  {activeOptCount}/8
                </span>
              }
            />

            <div className="label-eyebrow !text-[9px] mb-1 mt-1" style={{ color: "var(--sga-ink)" }}>
              Remove
            </div>
            <Toggle label="Dimensions" checked={opts.removeDimensions} onChange={(v) => setOpt("removeDimensions", v)} />
            <Toggle label="Labels / notes" checked={opts.removeLabels} onChange={(v) => setOpt("removeLabels", v)} />
            <Toggle label="Title block" checked={opts.removeTitleBlock} onChange={(v) => setOpt("removeTitleBlock", v)} />
            <Toggle label="Callouts" checked={opts.removeCallouts} onChange={(v) => setOpt("removeCallouts", v)} />
            <Toggle label="Hatch clutter" checked={opts.removeHatch} onChange={(v) => setOpt("removeHatch", v)} />

            <div className="label-eyebrow !text-[9px] mt-6 mb-1" style={{ color: "var(--sga-ink)" }}>
              Enhance
            </div>
            <Toggle label="Clean linework" checked={opts.cleanLinework} onChange={(v) => setOpt("cleanLinework", v)} />
            <Toggle label="Sharpen image" checked={opts.sharpen} onChange={(v) => setOpt("sharpen", v)} />
            <Toggle label="Crop & center" checked={opts.cropCenter} onChange={(v) => setOpt("cropCenter", v)} />

            <div className="label-eyebrow !text-[9px] mt-7 mb-3" style={{ color: "var(--sga-ink)" }}>
              Strength
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => (
                <Pill key={s} active={opts.strength === s} onClick={() => setOpt("strength", s)}>
                  {s}
                </Pill>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t hairline label-eyebrow !text-[8px] leading-relaxed">
              POST <span className="normal-case">{API_BASE}</span>/clean-image
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function PreviewPlate({
  label,
  img,
  caption,
  processing,
  stage,
}: {
  label: string;
  img: string | null;
  caption?: string;
  processing?: boolean;
  stage: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.22em]" style={{ color: "var(--sga-red)" }}>
            {stage}
          </span>
          <span className="label-eyebrow">{label}</span>
        </div>
        {caption && <div className="label-eyebrow !text-[9px]">{caption}</div>}
      </div>
      <Vitrine>
        <div className="relative aspect-[4/3] overflow-hidden">
          {img ? (
            <img src={img} alt={label} className="w-full h-full object-contain" />
          ) : processing ? (
            <ShimmerSkeleton />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <p className="font-display italic text-[15px] text-muted-foreground">No image yet.</p>
            </div>
          )}
          {processing && img === null && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-background/95 border hairline px-3 py-2">
              <span
                className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--border)", borderTopColor: "var(--sga-red)" }}
              />
              <span className="label-eyebrow !text-[9px]">Cleaning drawing…</span>
            </div>
          )}
        </div>
      </Vitrine>
    </div>
  );
}

function ShimmerSkeleton() {
  return (
    <div className="w-full h-full relative overflow-hidden surface">
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
