import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/studio/Shell";
import { ExtractTab } from "@/components/studio/ExtractTab";
import { CleanTab } from "@/components/studio/CleanTab";
import { SettingsTab } from "@/components/studio/SettingsTab";
import type { SheetRow, UploadedFile } from "@/lib/studio-types";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<"extract" | "clean" | "settings">("extract");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sheets, setSheets] = useState<SheetRow[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetRow | null>(null);

  return (
    <Shell active={tab} onChange={setTab}>
      {tab === "extract" && (
        <ExtractTab
          files={files}
          sheets={sheets}
          onFiles={setFiles}
          onSheets={setSheets}
          onUseSheet={(s) => {
            setActiveSheet(s);
            setTab("clean");
          }}
        />
      )}
      {tab === "clean" && <CleanTab activeSheet={activeSheet} setActiveSheet={setActiveSheet} />}
      {tab === "settings" && <SettingsTab />}
    </Shell>
  );
}
