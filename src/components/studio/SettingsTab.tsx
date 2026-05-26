import { useRef, useState } from "react";
import { SectionHeader, SectionBar, Vitrine, Field, TextInput, TextArea, Toggle, Pill } from "./primitives";
import type { CleanupOptions, FirmPreset } from "@/lib/studio-types";
import { DEFAULT_CLEANUP, DEFAULT_PRESETS } from "@/lib/studio-types";

export function SettingsTab() {
  const [presets, setPresets] = useState<FirmPreset[]>(DEFAULT_PRESETS);
  const [activeId, setActiveId] = useState(presets[0].id);
  const [cleanup, setCleanup] = useState<CleanupOptions>(DEFAULT_CLEANUP);
  const refRef = useRef<HTMLInputElement>(null);

  const active = presets.find((p) => p.id === activeId)!;

  function update<K extends keyof FirmPreset>(k: K, v: FirmPreset[K]) {
    setPresets((arr) => arr.map((p) => (p.id === activeId ? { ...p, [k]: v } : p)));
  }
  function addPreset() {
    const id = `preset-${Date.now()}`;
    const p: FirmPreset = {
      id,
      name: "Untitled Preset",
      programType: "",
      moodKeywords: "",
      materials: "",
      lightingStyle: "",
      negativePrompts: "",
      colorPalette: "#ffffff, #000000, #8f201f",
      referenceImageUrl: null,
    };
    setPresets((arr) => [...arr, p]);
    setActiveId(id);
  }
  function handleRef(files: FileList | null) {
    if (!files?.[0]) return;
    update("referenceImageUrl", URL.createObjectURL(files[0]));
  }

  const palette = active.colorPalette.split(",").map((c) => c.trim()).filter(Boolean);
  const strengths = ["Light", "Standard", "Aggressive"] as const;

  return (
    <div>
      <SectionHeader
        num="03"
        title="Settings"
        subtitle="Firm-wide presets, render direction, and default cleanup behaviour."
        right={
          <button
            onClick={addPreset}
            className="inline-flex items-center gap-2 px-3 h-8 border hairline font-mono text-[9px] tracking-[0.22em] uppercase hover:border-foreground transition-colors"
          >
            <span className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
            + New Preset
          </button>
        }
      />

      <section>
        <SectionBar
          label={`Firm Presets — ${String(presets.length).padStart(2, "0")}`}
          meta={<span>{active.name}</span>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-10">
          <aside className="border hairline self-start">
            <ul>
              {presets.map((p) => {
                const isActive = p.id === activeId;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setActiveId(p.id)}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hairline flex items-center justify-between gap-3 transition-colors ${
                        isActive ? "surface" : "hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`font-display text-[16px] leading-tight ${
                          isActive ? "" : "text-muted-foreground"
                        }`}
                      >
                        {p.name}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="border hairline p-6 md:p-8 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Preset Name">
                <TextInput value={active.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Program Type">
                <TextInput
                  value={active.programType}
                  placeholder="Hospitality, Residential, …"
                  onChange={(e) => update("programType", e.target.value)}
                />
              </Field>
              <Field label="Mood Keywords">
                <TextInput
                  value={active.moodKeywords}
                  placeholder="warm, intimate, golden hour"
                  onChange={(e) => update("moodKeywords", e.target.value)}
                />
              </Field>
              <Field label="Lighting Style">
                <TextInput
                  value={active.lightingStyle}
                  placeholder="soft north light, twilight, …"
                  onChange={(e) => update("lightingStyle", e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Materials">
                  <TextArea
                    value={active.materials}
                    onChange={(e) => update("materials", e.target.value)}
                    placeholder="walnut, travertine, brushed brass, linen"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Negative Prompts">
                  <TextArea
                    value={active.negativePrompts}
                    onChange={(e) => update("negativePrompts", e.target.value)}
                    placeholder="cold tones, clutter, harsh shadows"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Color Palette — comma separated hex">
                  <TextInput
                    value={active.colorPalette}
                    onChange={(e) => update("colorPalette", e.target.value)}
                  />
                </Field>
                <div className="flex gap-3 mt-4">
                  {palette.map((c, i) => (
                    <div key={i} className="flex-1">
                      <div className="h-14 border hairline" style={{ backgroundColor: c }} />
                      <div className="font-mono text-[9px] tracking-widest mt-2 text-muted-foreground uppercase">
                        {c}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <Field label="Reference Image">
                  <Vitrine>
                    <div
                      onClick={() => refRef.current?.click()}
                      className="aspect-[16/6] flex items-center justify-center cursor-pointer hover:bg-background overflow-hidden transition-colors"
                    >
                      {active.referenceImageUrl ? (
                        <img
                          src={active.referenceImageUrl}
                          alt="reference"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center px-6">
                          <div className="label-eyebrow mb-3">Upload Reference</div>
                          <p className="font-display italic text-[18px] text-muted-foreground">
                            Drop a hero image to steer the render direction
                          </p>
                        </div>
                      )}
                    </div>
                  </Vitrine>
                  <input
                    ref={refRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleRef(e.target.files)}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <SectionBar label="— Default Cleanup" meta="Applied to every new sheet" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          <div>
            <Toggle label="Remove dimensions" checked={cleanup.removeDimensions} onChange={(v) => setCleanup({ ...cleanup, removeDimensions: v })} />
            <Toggle label="Remove labels / notes" checked={cleanup.removeLabels} onChange={(v) => setCleanup({ ...cleanup, removeLabels: v })} />
            <Toggle label="Remove title block" checked={cleanup.removeTitleBlock} onChange={(v) => setCleanup({ ...cleanup, removeTitleBlock: v })} />
            <Toggle label="Remove callouts" checked={cleanup.removeCallouts} onChange={(v) => setCleanup({ ...cleanup, removeCallouts: v })} />
          </div>
          <div>
            <Toggle label="Remove hatch clutter" checked={cleanup.removeHatch} onChange={(v) => setCleanup({ ...cleanup, removeHatch: v })} />
            <Toggle label="Clean linework" checked={cleanup.cleanLinework} onChange={(v) => setCleanup({ ...cleanup, cleanLinework: v })} />
            <Toggle label="Sharpen image" checked={cleanup.sharpen} onChange={(v) => setCleanup({ ...cleanup, sharpen: v })} />
            <Toggle label="Crop & center" checked={cleanup.cropCenter} onChange={(v) => setCleanup({ ...cleanup, cropCenter: v })} />
          </div>
        </div>
        <div className="mt-8">
          <div className="label-eyebrow mb-3">Default Strength</div>
          <div className="flex gap-2">
            {strengths.map((s) => (
              <Pill key={s} active={cleanup.strength === s} onClick={() => setCleanup({ ...cleanup, strength: s })}>
                {s}
              </Pill>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
