import { ReactNode } from "react";

type Tab = "extract" | "clean" | "settings";

interface ShellProps {
  active: Tab;
  onChange: (t: Tab) => void;
  children: ReactNode;
}

const TABS: { id: Tab; label: string; num: string }[] = [
  { id: "extract", label: "Extract Drawings", num: "01" },
  { id: "clean", label: "Clean + Render", num: "02" },
  { id: "settings", label: "Settings", num: "03" },
];

export function Shell({ active, onChange, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b hairline">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 flex items-center justify-center text-[11px] font-mono tracking-wider text-white"
              style={{ backgroundColor: "var(--sga-red)" }}
            >
              SGA
            </div>
            <div className="leading-tight">
              <div className="font-display text-[18px]">Render Studio</div>
              <div className="label-eyebrow !text-[9px]">Sam Garcia Architect</div>
            </div>
          </div>
          <div className="hidden md:block label-eyebrow">v 0.1 — Internal</div>
        </div>
      </header>

      <nav className="border-b hairline sticky top-0 bg-background z-30">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 flex">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="group relative py-5 pr-10 flex items-end gap-3 text-left"
              >
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                  {t.num}
                </span>
                <span
                  className={`font-display text-[20px] md:text-[22px] leading-none transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </span>
                {isActive && (
                  <span
                    className="absolute left-0 right-6 -bottom-px h-px"
                    style={{ backgroundColor: "var(--sga-red)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-6 md:px-10 py-10 md:py-14">{children}</main>

      <footer className="border-t hairline mt-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-6 flex flex-wrap items-center justify-between gap-3">
          <div className="label-eyebrow">© SGA — Render Studio</div>
          <div className="label-eyebrow">Endpoints — /extract-pdf · /clean-image · /generated/:file</div>
        </div>
      </footer>
    </div>
  );
}
