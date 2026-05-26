import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Centered "Gallery Vitrine" section header.
 * red square + eyebrow · large Cormorant title · centered subtitle ·
 * optional `right` slot rendered centered below as a pill row.
 */
export function SectionHeader({
  num,
  title,
  subtitle,
  right,
}: {
  num: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="text-center mb-12 md:mb-16">
      <div className="flex justify-center items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
        <div className="label-eyebrow">— {num} · Primary Module</div>
      </div>
      <h2 className="editorial-h1 text-[44px] md:text-[64px] lg:text-[72px] mb-4">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      {right && <div className="mt-6 flex justify-center">{right}</div>}
    </div>
  );
}

/**
 * Section bar — eyebrow left, optional Cormorant italic count/label right,
 * hairline below. Used between sub-sections inside a tab.
 */
export function SectionBar({
  label,
  meta,
  action,
}: {
  label: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b hairline pb-2 mb-5">
      <div className="flex items-center gap-3">
        <div className="label-eyebrow">{label}</div>
        {action}
      </div>
      {meta && <div className="font-display italic text-[15px]">{meta}</div>}
    </div>
  );
}

/**
 * Vitrine — framed plate. Outer hairline + 4px gutter, inner hairline pane,
 * tiny red L-shape corner ticks at top-left and bottom-right.
 */
export function Vitrine({
  children,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={`vitrine ${className}`}>
      <div className={`vitrine-inner ${innerClassName}`}>{children}</div>
    </div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "accent";
}

export function Btn({ variant = "outline", className = "", children, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 h-10 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-foreground text-background hover:bg-foreground/85",
    ghost: "text-muted-foreground hover:text-foreground",
    outline: "border hairline hover:border-foreground hover:text-foreground",
    accent: "text-white",
  };
  const accentStyle = variant === "accent" ? { backgroundColor: "var(--sga-red)" } : undefined;
  return (
    <button className={`${base} ${styles[variant]} ${className}`} style={accentStyle} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="label-eyebrow mb-2">{label}</div>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 border hairline bg-background text-sm focus:outline-none focus:border-foreground transition-colors ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 border hairline bg-background text-sm focus:outline-none focus:border-foreground transition-colors resize-y min-h-[80px] ${props.className ?? ""}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-3 border-b hairline text-left group"
    >
      <span className="text-sm group-hover:text-foreground transition-colors">{label}</span>
      <span
        className={`relative w-9 h-5 border hairline transition-colors`}
        style={checked ? { backgroundColor: "var(--sga-red)", borderColor: "var(--sga-red)" } : { backgroundColor: "var(--background)" }}
      >
        <span
          className={`absolute top-0.5 ${checked ? "right-0.5" : "left-0.5"} w-3.5 h-3.5 transition-all ${
            checked ? "bg-white" : "bg-foreground"
          }`}
        />
      </span>
    </button>
  );
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 h-9 font-mono text-[10px] tracking-[0.22em] uppercase border hairline transition-colors ${
        active ? "text-white" : "hover:bg-muted"
      }`}
      style={active ? { backgroundColor: "var(--sga-red)", borderColor: "var(--sga-red)" } : undefined}
    >
      {children}
    </button>
  );
}

export function Banner({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning";
  title: string;
  children?: ReactNode;
}) {
  const borderColor = tone === "warning" ? "var(--sga-red)" : "var(--border)";
  return (
    <div className="border-l-2 pl-5 py-4 surface" style={{ borderColor }}>
      <div className="label-eyebrow mb-1" style={tone === "warning" ? { color: "var(--sga-red)" } : undefined}>
        {tone === "warning" ? "Backend Required" : "Note"}
      </div>
      <div className="font-display text-[20px] leading-tight">{title}</div>
      {children && <div className="text-sm text-muted-foreground mt-2 max-w-2xl">{children}</div>}
    </div>
  );
}
