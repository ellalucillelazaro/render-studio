export const API_BASE = "http://localhost:8000";

export function toAbsolute(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
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
