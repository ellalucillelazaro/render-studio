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

// Single restrained container width — vitrine, not dashboard
const CONTAINER = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 md:px-12";

export function Shell({ active, onChange, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b hairline">
        <div className={`${CONTAINER} py-5 flex items-end justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-[10px] font-mono tracking-wider text-white"
              style={{ backgroundColor: "var(--sga-red)" }}
            >
              SGA
            </div>
            <div className="leading-tight">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase">Render Studio</div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                Sam Garcia Architect
              </div>
            </div>
          </div>
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            v 0.1 — Internal
          </div>
        </div>
      </header>

      <nav className="border-b hairline sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className={CONTAINER}>
          <ul className="flex flex-wrap gap-x-10 md:gap-x-14 gap-y-2 py-4">
            {TABS.map((t) => {
              const isActive = active === t.id;
              return (
                <li key={t.id} className="relative">
                  <button
                    onClick={() => onChange(t.id)}
                    className="group flex flex-col items-start text-left"
                  >
                    <span
                      className={`font-mono text-[10px] tracking-[0.22em] leading-none mb-1.5 transition-colors ${
                        isActive ? "text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {t.num}
                    </span>
                    <span
                      className={`font-display text-[18px] md:text-[20px] leading-none transition-colors ${
                        isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </span>
                    {isActive && (
                      <span
                        className="absolute left-0 right-0 -bottom-[17px] h-px"
                        style={{ backgroundColor: "var(--sga-red)" }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <main className={`${CONTAINER} py-14 md:py-20 flex-1`}>{children}</main>

      <footer className="border-t hairline mt-auto">
        <div className={`${CONTAINER} py-6 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className="label-eyebrow !text-[9px]">© SGA — Render Studio</span>
            <span className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
          </div>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>Endpoints —</span>
            <span>/extract-pdf</span>
            <span className="opacity-30">/</span>
            <span>/clean-image</span>
            <span className="opacity-30">/</span>
            <span>/generated/:file</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
