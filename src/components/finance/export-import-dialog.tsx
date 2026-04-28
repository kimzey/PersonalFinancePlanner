"use client";

import { Download, FileJson, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ImportPreview } from "@/components/finance/import-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  createExportData,
  getExportFileName,
  mergeImportedPlan,
  serializeExportData,
  toFinancialPlan,
} from "@/lib/export-import";
import { validateImportJson } from "@/lib/import-validation";
import { createScenarioFromPlan, type ScenarioPlan } from "@/lib/scenarios";
import type { FinancialPlan } from "@/types/finance";
import type { ExportOptions, ImportMode } from "@/types/import-export";

type ExportImportDialogProps = {
  currentPlan: FinancialPlan;
  open: boolean;
  onImportPlan: (plan: FinancialPlan) => void;
  onImportScenario: (scenario: ScenarioPlan) => void;
  onImportComplete?: (message: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function ExportImportDialog({
  currentPlan,
  onImportComplete,
  onImportPlan,
  onImportScenario,
  onOpenChange,
  open,
}: ExportImportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeActualExpenses: false,
    includeNotes: true,
    anonymize: false,
  });
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [message, setMessage] = useState("");

  const exportData = useMemo(
    () => createExportData(currentPlan, exportOptions),
    [currentPlan, exportOptions],
  );
  const exportText = useMemo(() => serializeExportData(exportData), [exportData]);
  const importResult = useMemo(
    () => (importText.trim() ? validateImportJson(importText) : null),
    [importText],
  );

  function downloadExport() {
    const blob = new Blob([exportText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getExportFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`ดาวน์โหลด ${anchor.download} แล้ว`);
  }

  function applyImport() {
    if (!importResult?.ok) return;

    if (importMode === "scenario") {
      const scenario = createScenarioFromPlan(
        toFinancialPlan(importResult.data),
        `Imported ${new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`,
      );
      onImportScenario(scenario);
      const successMessage = "เพิ่มไฟล์นำเข้าเป็น scenario แล้ว";
      setMessage(successMessage);
      onImportComplete?.(successMessage);
      onOpenChange(false);
      return;
    }

    onImportPlan(mergeImportedPlan(currentPlan, importResult.data, importMode));
    const successMessage =
      importMode === "replace"
        ? `แทนที่แผนทั้งหมดแล้ว: รายได้ ${importResult.data.profile.netIncome.toLocaleString("th-TH")} บาท`
        : "รวมข้อมูลนำเข้าแล้ว";
    setMessage(successMessage);
    onImportComplete?.(successMessage);
    onOpenChange(false);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setImportText(await file.text());
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] w-[min(94vw,60rem)] overflow-y-auto">
        <DialogHeader className="mb-3 flex-row items-start justify-between gap-4">
          <div>
            <DialogTitle>Export / Import Data</DialogTitle>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              ส่งออก JSON หรือนำเข้าไฟล์โดย preview ก่อนเขียนทับข้อมูล
            </p>
          </div>
          <Button
            aria-label="ปิด export import"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="grid gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </div>

            <div className="grid gap-3 rounded-lg border border-[var(--border)] p-4">
              <OptionSwitch
                checked={exportOptions.includeActualExpenses}
                label="Include actual expenses"
                onCheckedChange={(checked) =>
                  setExportOptions((options) => ({
                    ...options,
                    includeActualExpenses: checked,
                  }))
                }
              />
              <OptionSwitch
                checked={exportOptions.includeNotes}
                disabled={exportOptions.anonymize}
                label="Include notes"
                onCheckedChange={(checked) =>
                  setExportOptions((options) => ({ ...options, includeNotes: checked }))
                }
              />
              <OptionSwitch
                checked={exportOptions.anonymize}
                label="Anonymize before export"
                onCheckedChange={(checked) =>
                  setExportOptions((options) => ({
                    ...options,
                    anonymize: checked,
                    includeNotes: checked ? false : options.includeNotes,
                  }))
                }
              />
            </div>

            <textarea
              className="min-h-72 resize-y rounded-md border border-[var(--input)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              readOnly
              value={exportText}
            />

            <Button onClick={downloadExport} type="button">
              <FileJson className="h-4 w-4" aria-hidden="true" />
              Download JSON
            </Button>
          </section>

          <section className="grid gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import
            </div>

            <div className="grid gap-3 rounded-lg border border-[var(--border)] p-4">
              <div className="grid gap-2">
                <Label htmlFor="import-mode">Import mode</Label>
                <Select
                  id="import-mode"
                  onChange={(event) => setImportMode(event.target.value as ImportMode)}
                  value={importMode}
                >
                  <option value="replace">Replace all</option>
                  <option value="merge">Merge</option>
                  <option value="scenario">Import as scenario</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="import-file">JSON file</Label>
                <input
                  accept="application/json,.json"
                  className="text-sm"
                  id="import-file"
                  onChange={(event) => void readFile(event.target.files?.[0])}
                  type="file"
                />
              </div>

              <textarea
                className="min-h-48 resize-y rounded-md border border-[var(--input)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                onChange={(event) => setImportText(event.target.value)}
                placeholder="วาง JSON ที่ต้องการ import"
                value={importText}
              />
            </div>

            <ImportPreview mode={importMode} onApply={applyImport} result={importResult} />
          </section>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">{message}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function OptionSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  );
}
