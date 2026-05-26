import { useRef, useState } from "react";
import { SectionHeader, Btn, Pill, Toggle, Banner } from "./primitives";
import type { CleanupOptions, CleanupStrength, SheetRow } from "@/lib/studio-types";
import { DEFAULT_CLEANUP } from "@/lib/studio-types";
import { cleanImage } from "@/lib/studio-api";

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
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewPane label="Before" img={activeSheet?.thumbnailUrl ?? null} caption={activeSheet?.sheetNumber} />
            <PreviewPane
              label="After"
              img={cleaned}
              caption={cleaned ? "Cleaned" : processing ? "Processing…" : "Awaiting cleanup"}
              tinted
            />
          </div>

          {error && (
            <div className="mt-6">
              <Banner tone="warning" title="Cleanup failed">
                {error}. Ensure the backend is running at <span className="font-mono">http://localhost:8000</span> and that <span className="font-mono">POST /clean-image</span> is reachable.
              </Banner>
            </div>
          )}

          {activeSheet && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t hairline pt-5">
              <div className="label-eyebrow">
                Source — {activeSheet.sourceFile}
              </div>
              <div className="flex gap-2">
                <Btn variant="accent" onClick={runClean} disabled={processing}>
                  {processing ? "Cleaning…" : "Clean Drawing"}
                </Btn>
                <Btn variant="primary" onClick={download} disabled={!cleaned}>
                  Download Cleaned PNG
                </Btn>
              </div>
            </div>
          )}
        </div>

        <aside className="border hairline p-5">
          <div className="label-eyebrow mb-4">Cleanup Options</div>
          <Toggle label="Remove dimensions" checked={opts.removeDimensions} onChange={(v) => setOpt("removeDimensions", v)} />
          <Toggle label="Remove labels / notes" checked={opts.removeLabels} onChange={(v) => setOpt("removeLabels", v)} />
          <Toggle label="Remove title block" checked={opts.removeTitleBlock} onChange={(v) => setOpt("removeTitleBlock", v)} />
          <Toggle label="Remove callouts" checked={opts.removeCallouts} onChange={(v) => setOpt("removeCallouts", v)} />
          <Toggle label="Remove hatch clutter" checked={opts.removeHatch} onChange={(v) => setOpt("removeHatch", v)} />
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
}: {
  label: string;
  img: string | null;
  caption?: string;
  tinted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="label-eyebrow">{label}</div>
        {caption && <div className="label-eyebrow !text-[9px]">{caption}</div>}
      </div>
      <div className={`border hairline aspect-[4/3] overflow-hidden ${tinted ? "bg-muted/40" : "bg-muted"}`}>
        {img ? (
          <img src={img} alt={label} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
    </div>
  );
}
