export const API_BASE = "http://localhost:8000";

export function toAbsolute(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Build a URL for GET /generated/{filename}.
 * Accepts either a bare filename ("page-1.png") or a server-relative
 * path ("/generated/page-1.png"); always returns an absolute URL.
 */
export function generatedUrl(filenameOrPath: string): string {
  if (!filenameOrPath) return filenameOrPath;
  if (/^https?:\/\//i.test(filenameOrPath)) return filenameOrPath;
  if (filenameOrPath.startsWith("/")) return `${API_BASE}${filenameOrPath}`;
  return `${API_BASE}/generated/${filenameOrPath}`;
}

/** Lightweight backend reachability probe. Does not throw. */
export async function pingBackend(timeoutMs = 1500): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    // HEAD on root — most dev servers respond with something < 500.
    const res = await fetch(`${API_BASE}/`, { method: "GET", signal: ctl.signal, mode: "cors" }).catch(
      () => null,
    );
    clearTimeout(t);
    return !!res; // any response, even 404, means the server is up
  } catch {
    return false;
  }
}

export interface ExtractedSheetDTO {
  id: string;
  sheet: string;
  title: string;
  type: string;
  preview_url: string;
}

export async function extractPdf(file: File): Promise<ExtractedSheetDTO[]> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/extract-pdf`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`extract-pdf failed: ${res.status}`);
  const data = await res.json();
  return data.sheets ?? [];
}

export interface CleanImageOptions {
  removeDimensions?: boolean;
  removeLabels?: boolean;
  removeTitleBlock?: boolean;
  removeCallouts?: boolean;
  removeHatch?: boolean;
  cleanLinework?: boolean;
  sharpen?: boolean;
  cropCenter?: boolean;
  strength?: string;
}

export async function cleanImage(args: {
  file?: File;
  imageUrl?: string;
  options: CleanImageOptions;
}): Promise<string> {
  const fd = new FormData();
  if (args.file) fd.append("file", args.file);
  if (args.imageUrl) fd.append("image_url", args.imageUrl);
  fd.append("options", JSON.stringify(args.options));
  const res = await fetch(`${API_BASE}/clean-image`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`clean-image failed: ${res.status}`);
  const data = await res.json();
  if (!data.cleaned_url) throw new Error("Missing cleaned_url in response");
  return toAbsolute(data.cleaned_url);
}
