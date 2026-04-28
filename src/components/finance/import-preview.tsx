"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type {
  ImportMode,
  ImportPreviewSummary,
  ImportValidationResult,
} from "@/types/import-export";

type ImportPreviewProps = {
  mode: ImportMode;
  result: ImportValidationResult | null;
  onApply: () => void;
};

export function ImportPreview({ mode, result, onApply }: ImportPreviewProps) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
        เลือกไฟล์หรือวาง JSON เพื่อดู preview ก่อนนำเข้า
      </div>
    );
  }

  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertTitle>นำเข้าไม่ได้</AlertTitle>
        <AlertDescription>
          <ul className="list-inside list-disc">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 rounded-lg border border-[var(--border)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Import Preview</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            ตรวจข้อมูลก่อนใช้โหมด {getModeLabel(mode)}
          </p>
        </div>
        <Badge>Schema v{result.summary.schemaVersion}</Badge>
      </div>

      <SummaryGrid summary={result.summary} />

      {result.warnings.length > 0 ? (
        <Alert>
          <AlertTitle>ควรตรวจสอบก่อนนำเข้า</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={onApply} type="button" variant={mode === "replace" ? "destructive" : "default"}>
          {getApplyLabel(mode)}
        </Button>
      </div>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: ImportPreviewSummary }) {
  const items = [
    ["รายได้สุทธิ", formatCurrency(summary.netIncome)],
    ["Allocations", summary.allocationCount.toLocaleString("th-TH")],
    ["Investment", summary.investmentScenarioCount.toLocaleString("th-TH")],
    ["Goals", summary.goalCount.toLocaleString("th-TH")],
    ["Debts", summary.debtCount.toLocaleString("th-TH")],
    ["Expenses", summary.expenseCount.toLocaleString("th-TH")],
    ["Reviews", summary.monthlyReviewCount.toLocaleString("th-TH")],
    ["Notes", summary.noteCount.toLocaleString("th-TH")],
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div className="rounded-md bg-[var(--muted)] p-3" key={label}>
          <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
          <div className="mt-1 text-sm font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
}

function getModeLabel(mode: ImportMode) {
  if (mode === "replace") return "Replace all";
  if (mode === "merge") return "Merge";
  return "Import as scenario";
}

function getApplyLabel(mode: ImportMode) {
  if (mode === "replace") return "ยืนยันแทนที่ทั้งหมด";
  if (mode === "merge") return "นำเข้าและรวมข้อมูล";
  return "เพิ่มเป็น scenario";
}
