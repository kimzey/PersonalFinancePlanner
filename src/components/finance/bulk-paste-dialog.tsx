"use client";

import { useMemo, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { categorySuggestions } from "@/components/finance/category-suggestions";
import { parseCalculatorInput } from "@/lib/calculators";
import { amountToPercent, normalizeAllocations } from "@/lib/finance";
import type { AllocationCategory, AllocationKind } from "@/types/finance";

type BulkPasteDialogProps = {
  netIncome: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (allocations: AllocationCategory[], mode: "append" | "replace") => void;
};

type PasteRow = {
  id: string;
  line: string;
  name: string;
  amount: number;
  kind: AllocationKind;
  color: string;
  error?: string;
};

const fallbackKinds: AllocationKind[] = [
  "necessary",
  "fixed",
  "saving",
  "investing",
  "lifestyle",
  "family",
  "debt",
  "other",
];

export function BulkPasteDialog({
  netIncome,
  onApply,
  onOpenChange,
  open,
}: BulkPasteDialogProps) {
  const [pasteText, setPasteText] = useState(
    "ค่าอาหาร 5000\nค่าเดินทาง 2500\nลงทุน 8k\nเงินฉุกเฉิน 12000+3500",
  );
  const [mode, setMode] = useState<"append" | "replace">("append");
  const rows = useMemo(() => parseBulkPaste(pasteText), [pasteText]);
  const validRows = rows.filter((row) => !row.error);

  function applyRows() {
    const allocations = validRows.map<AllocationCategory>((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      percent: amountToPercent(row.amount, netIncome),
      mode: "amount",
      color: row.color,
      kind: row.kind,
    }));

    onApply(normalizeAllocations(allocations, netIncome), mode);
    onOpenChange(false);
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[88vh] w-[min(94vw,48rem)] overflow-y-auto">
        <DialogHeader className="mb-3 flex-row items-start justify-between gap-4">
          <div>
            <DialogTitle>Bulk Paste รายการจัดสรร</DialogTitle>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              วางรายการแบบหนึ่งบรรทัดต่อหนึ่งหมวด เช่น `ค่าอาหาร 5k`
            </p>
          </div>
          <Button
            aria-label="ปิด bulk paste"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4">
          <textarea
            className="min-h-40 resize-y rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            onChange={(event) => setPasteText(event.target.value)}
            value={pasteText}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              aria-label="โหมดการนำเข้า"
              className="sm:w-44"
              onChange={(event) => setMode(event.target.value as "append" | "replace")}
              value={mode}
            >
              <option value="append">เพิ่มต่อท้าย</option>
              <option value="replace">แทนที่ทั้งหมด</option>
            </Select>
            <div className="text-sm text-[var(--muted-foreground)]">
              ใช้ได้ {validRows.length}/{rows.length} รายการ
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <div className="grid grid-cols-[1.4fr_8rem_7rem] gap-3 bg-[var(--muted)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
              <span>หมวด</span>
              <span>จำนวน</span>
              <span>ประเภท</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {rows.map((row) => (
                <div
                  className="grid grid-cols-[1.4fr_8rem_7rem] gap-3 border-t border-[var(--border)] px-3 py-2 text-sm"
                  key={row.id}
                >
                  <span className={row.error ? "text-[var(--destructive)]" : ""}>
                    {row.error ?? row.name}
                  </span>
                  <span>{row.error ? "-" : row.amount.toLocaleString("th-TH")}</span>
                  <span>{row.error ? "-" : row.kind}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              ยกเลิก
            </Button>
            <Button disabled={validRows.length === 0} onClick={applyRows} type="button">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {mode === "replace" ? "แทนที่ด้วยรายการนี้" : "เพิ่มรายการ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function parseBulkPaste(input: string): PasteRow[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => parsePasteLine(line, index));
}

function parsePasteLine(line: string, index: number): PasteRow {
  const parts = line.split(/\s+/);
  const amountIndex = parts.findIndex((part) => {
    try {
      parseCalculatorInput(part);
      return true;
    } catch {
      return false;
    }
  });

  if (amountIndex === -1) {
    return createErrorRow(line, index, "ไม่พบจำนวนเงิน");
  }

  const name = parts.slice(0, amountIndex).join(" ").trim();
  const expression = parts[amountIndex];
  const kindInput = parts.slice(amountIndex + 1).join(" ").trim().toLowerCase();

  if (!name) {
    return createErrorRow(line, index, "ไม่พบชื่อหมวด");
  }

  try {
    const suggestion = categorySuggestions.find((category) => category.name === name);
    const kind = resolveKind(kindInput, suggestion?.kind);

    return {
      id: `bulk-${index}-${name}`,
      line,
      name,
      amount: Math.max(0, parseCalculatorInput(expression)),
      kind,
      color: suggestion?.color ?? colorForKind(kind),
    };
  } catch (error) {
    return createErrorRow(
      line,
      index,
      error instanceof Error ? error.message : "รายการไม่ถูกต้อง",
    );
  }
}

function resolveKind(input: string, fallback?: AllocationKind): AllocationKind {
  if (fallbackKinds.includes(input as AllocationKind)) return input as AllocationKind;
  return fallback ?? "other";
}

function colorForKind(kind: AllocationKind) {
  return categorySuggestions.find((category) => category.kind === kind)?.color ?? "#64748b";
}

function createErrorRow(line: string, index: number, error: string): PasteRow {
  return {
    id: `bulk-error-${index}`,
    line,
    name: line,
    amount: 0,
    kind: "other",
    color: "#64748b",
    error,
  };
}
