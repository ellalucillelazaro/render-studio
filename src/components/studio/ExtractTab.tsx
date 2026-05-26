import { useRef, useState } from "react";
import { SectionHeader, Btn, Banner } from "./primitives";
import type { SheetRow, UploadedFile } from "@/lib/studio-types";

interface Props {
  files: UploadedFile[];
  sheets: SheetRow[];
  onFiles: (f: UploadedFile[]) => void;
  onSheets: (s: SheetRow[]) => void;
  onUseSheet: (s: SheetRow) => void;
}

export function ExtractTab({ files, sheets, onFiles, onSheets, onUseSheet }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfBlocked, setPdfBlocked] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next: UploadedFile[] = [];
    const newImageSheets: SheetRow[] = [];
    let sawPdf = false;

    Array.from(list).forEach((file, idx) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImg = file.type.startsWith("image/");
      if (!isPdf && !isImg) return;

      const url = URL.createObjectURL(file);
      const uf: UploadedFile = {
        id: `${Date.now()}-${idx}-${file.name}`,
        name: file.name,
        size: file.size,
        kind: isPdf ? "pdf" : "image",
        url,
      };
      next.push(uf);

      if (isPdf) {
        sawPdf = true;
      } else {
        newImageSheets.push({
          id: uf.id,
          sourceFile: file.name,
          sheetNumber: inferSheetNumber(file.name) ?? `IMG-${sheets.length + newImageSheets.length + 1}`,
          title: stripExt(file.name),
          drawingType: "Unknown",
          thumbnailUrl: url,
        });
      }
    });

    if (sawPdf) setPdfBlocked(true);
    onFiles([...files, ...next]);
    if (newImageSheets.length) onSheets([...sheets, ...newImageSheets]);
  }

  return (
    <div>
      <SectionHeader
        num="01"
        title="Extract Drawings"
        subtitle="Upload full construction sets or individual sheet exports. The studio detects the file type and surfaces every sheet for review."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer border hairline aspect-[16/7] flex flex-col items-center justify-center text-center px-6 transition-colors ${
              dragOver ? "bg-muted" : "bg-background hover:bg-muted/40"
            }`}
            style={dragOver ? { borderColor: "var(--sga-red)" } : undefined}
          >
            <div className="label-eyebrow mb-4">Drop / Browse</div>
            <div className="font-display text-[32px] md:text-[44px] leading-tight max-w-xl">
              Drop a construction set or sheet exports here
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              PDF · PNG · JPG &nbsp;—&nbsp; multi-file supported
            </div>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {pdfBlocked && (
            <div className="mt-6">
              <Banner tone="warning" title="Backend required for PDF conversion">
                PDF sheets are uploaded but not yet split into individual drawings. Connect the
                backend endpoint <span className="font-mono">POST /extract-pdf</span> to convert
                pages, run sheet-number OCR, and render thumbnails.
              </Banner>
            </div>
          )}
        </div>

        <aside>
          <div className="label-eyebrow mb-4">Uploaded Files — {files.length}</div>
          {files.length === 0 ? (
            <div className="text-sm text-muted-foreground border hairline p-5">
              Nothing uploaded yet.
            </div>
          ) : (
            <ul className="border hairline divide-y divide-[color:var(--border)]">
              {files.map((f) => (
                <li key={f.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{f.name}</div>
                    <div className="label-eyebrow !text-[9px] mt-1">
                      {f.kind.toUpperCase()} · {(f.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] tracking-widest px-2 py-0.5"
                    style={
                      f.kind === "pdf"
                        ? { color: "var(--sga-red)", border: "1px solid var(--sga-red)" }
                        : { border: "1px solid var(--border)" }
                    }
                  >
                    {f.kind === "pdf" ? "PDF" : "IMG"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="mt-16">
        <div className="flex items-end justify-between mb-6 pb-4 border-b hairline">
          <div>
            <div className="label-eyebrow mb-2">Extracted Sheets</div>
            <h3 className="font-display text-[28px]">{sheets.length} drawing{sheets.length === 1 ? "" : "s"}</h3>
          </div>
          {sheets.length > 0 && (
            <Btn variant="ghost" onClick={() => onSheets([])}>
              Clear All
            </Btn>
          )}
        </div>

        {sheets.length === 0 ? (
          <div className="border hairline p-10 text-center text-sm text-muted-foreground">
            Sheets will appear here after upload. Image uploads are surfaced immediately; PDFs
            require the conversion backend.
          </div>
        ) : (
          <div className="border hairline">
            <div className="grid grid-cols-[110px_120px_1fr_160px_140px] label-eyebrow px-5 py-3 border-b hairline">
              <div>Thumb</div>
              <div>Sheet №</div>
              <div>Title</div>
              <div>Type</div>
              <div className="text-right">Action</div>
            </div>
            {sheets.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[110px_120px_1fr_160px_140px] items-center px-5 py-4 border-b last:border-b-0 hairline gap-4"
              >
                <div className="w-[90px] h-[60px] border hairline overflow-hidden bg-muted">
                  {s.thumbnailUrl ? (
                    <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center label-eyebrow !text-[9px]">
                      No Thumb
                    </div>
                  )}
                </div>
                <div className="font-mono text-sm">{s.sheetNumber}</div>
                <div className="text-sm truncate">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.drawingType}</div>
                <div className="text-right">
                  <Btn variant="accent" onClick={() => onUseSheet(s)}>
                    Use Sheet
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function stripExt(n: string) {
  return n.replace(/\.[^.]+$/, "");
}
function inferSheetNumber(n: string): string | null {
  const m = n.match(/([A-Z]{1,2}-?\d{2,4}(?:\.\d+)?)/i);
  return m ? m[1].toUpperCase() : null;
}
