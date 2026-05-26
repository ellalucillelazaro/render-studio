import { useRef, useState } from "react";
import { SectionHeader, Btn, Field, TextInput, TextArea, Toggle, Pill } from "./primitives";
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
        right={<Btn variant="accent" onClick={addPreset}>+ New Preset</Btn>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
        <aside className="border hairline">
          <div className="label-eyebrow px-4 py-3 border-b hairline">Firm Presets</div>
          <ul>
            {presets.map((p) => {
              const isActive = p.id === activeId;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setActiveId(p.id)}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 hairline flex items-center justify-between gap-3 ${
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-display text-[16px] leading-tight">{p.name}</span>
                    {isActive && (
                      <span className="w-2 h-2" style={{ backgroundColor: "var(--sga-red)" }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="border hairline p-6 md:p-8">
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
              <div className="flex gap-2 mt-3">
                {palette.map((c, i) => (
                  <div key={i} className="flex-1">
                    <div className="h-12 border hairline" style={{ backgroundColor: c }} />
                    <div className="font-mono text-[10px] mt-1 text-muted-foreground">{c}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Reference Image">
                <div
                  onClick={() => refRef.current?.click()}
                  className="border hairline aspect-[16/6] flex items-center justify-center cursor-pointer hover:bg-muted overflow-hidden"
                >
                  {active.referenceImageUrl ? (
                    <img src={active.referenceImageUrl} alt="reference" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="label-eyebrow mb-2">Upload Reference</div>
                      <div className="text-sm text-muted-foreground">Drop a hero image to steer the render direction</div>
                    </div>
                  )}
                </div>
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
        </section>
      </div>

      <div className="mt-16">
        <div className="flex items-end justify-between mb-6 pb-4 border-b hairline">
          <div>
            <div className="label-eyebrow mb-2">— Defaults</div>
            <h3 className="font-display text-[28px]">Default Cleanup Settings</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
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
        <div className="mt-6">
          <div className="label-eyebrow mb-3">Default Strength</div>
          <div className="flex gap-2">
            {strengths.map((s) => (
              <Pill key={s} active={cleanup.strength === s} onClick={() => setCleanup({ ...cleanup, strength: s })}>
                {s}
              </Pill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
