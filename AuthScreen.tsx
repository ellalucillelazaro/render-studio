import { FormEvent, ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Btn, Vitrine } from "./primitives";

type AuthStep = "login" | "forgot" | "verify";

interface AuthScreenProps {
  onAuthenticated: (email: string) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function goToLogin() {
    setStep("login");
    setPassword("");
    setCode("");
    setMessage("");
    setError("");
  }

  function startForgotPassword() {
    setStep("forgot");
    setResetEmail(email);
    setCode("");
    setMessage("");
    setError("");
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }

    // TODO: Replace this mock check with backend email/password authentication.
    onAuthenticated(email.trim());
  }

  function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!resetEmail.trim()) {
      setError("Enter your email to receive a reset code.");
      return;
    }

    // TODO: Connect this to backend password-reset email delivery.
    setStep("verify");
    setMessage("Check your email for a reset code");
    setCode("");
  }

  function handleResendCode() {
    setError("");
    // TODO: Trigger backend reset-code resend for this email address.
    setMessage("Check your email for a reset code");
  }

  function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // TODO: Verify reset codes with the backend before allowing password changes.
    if (code === "123456") {
      setMessage("Code verified. Return to login to continue.");
      return;
    }

    setError("Enter the 6-digit code from your email.");
  }

  const title =
    step === "login" ? "Studio Login" : step === "forgot" ? "Reset Access" : "Verify Code";
  const subtitle =
    step === "login"
      ? "Sign in to open the SGA Render Studio workspace."
      : step === "forgot"
        ? "Enter your email and we will send a reset code."
        : "Check your email for a reset code";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b hairline">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 md:px-12 py-5 flex items-end justify-between gap-4">
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
            Secure Access
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-8 md:px-12 py-12 md:py-20 flex items-center justify-center">
        <section className="w-full max-w-[460px]">
          <div className="text-center mb-9">
            <div className="flex justify-center items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5" style={{ backgroundColor: "var(--sga-red)" }} />
              <span className="label-eyebrow">Internal Workspace</span>
            </div>
            <h1 className="editorial-h1 text-[44px] md:text-[56px] mb-4">{title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          <Vitrine>
            <div className="p-6 md:p-8 bg-background">
              {step === "login" && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <AuthField label="Email">
                    <input
                      type="email"
                      value={email}
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full h-11 px-3 border hairline bg-background text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </AuthField>

                  <AuthField label="Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        autoComplete="current-password"
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full h-11 pl-3 pr-12 border hairline bg-background text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 w-11 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </AuthField>

                  <div className="flex items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="h-3.5 w-3.5 border hairline"
                        style={{ accentColor: "var(--sga-red)" }}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={startForgotPassword}
                      className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <AuthFeedback error={error} message={message} />

                  <Btn type="submit" variant="accent" className="w-full">
                    Login
                  </Btn>
                </form>
              )}

              {step === "forgot" && (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <AuthField label="Email">
                    <input
                      type="email"
                      value={resetEmail}
                      autoComplete="email"
                      onChange={(event) => setResetEmail(event.target.value)}
                      className="w-full h-11 px-3 border hairline bg-background text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </AuthField>

                  <AuthFeedback error={error} message={message} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Btn type="submit" variant="accent" className="w-full">
                      Send Code
                    </Btn>
                    <Btn type="button" variant="outline" className="w-full" onClick={goToLogin}>
                      Back to Login
                    </Btn>
                  </div>
                </form>
              )}

              {step === "verify" && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <AuthField label="Code">
                    <input
                      type="text"
                      value={code}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full h-11 px-3 border hairline bg-background text-sm font-mono tracking-[0.35em] focus:outline-none focus:border-foreground transition-colors"
                    />
                  </AuthField>

                  <AuthFeedback error={error} message={message} />

                  <Btn type="submit" variant="accent" className="w-full">
                    Verify Code
                  </Btn>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Btn type="button" variant="outline" className="w-full" onClick={handleResendCode}>
                      Resend Code
                    </Btn>
                    <Btn type="button" variant="outline" className="w-full" onClick={goToLogin}>
                      Back to Login
                    </Btn>
                  </div>
                </form>
              )}
            </div>
          </Vitrine>

          <div className="mt-6 flex items-center justify-center gap-2 label-eyebrow !text-[8px]">
            <span>SGA</span>
            <span className="w-1 h-1" style={{ backgroundColor: "var(--sga-red)" }} />
            <span>Render Studio</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label-eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function AuthFeedback({ error, message }: { error: string; message: string }) {
  if (!error && !message) return null;

  return (
    <div
      className="border-l-2 pl-4 py-3 text-sm leading-relaxed surface"
      style={{ borderColor: error ? "var(--sga-red)" : "var(--border)" }}
    >
      <div
        className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1"
        style={error ? { color: "var(--sga-red)" } : undefined}
      >
        {error ? "Attention" : "Notice"}
      </div>
      <div className="text-muted-foreground">{error || message}</div>
    </div>
  );
}
