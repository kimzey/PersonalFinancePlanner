"use client";

import { Calculator, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateThaiPersonalIncomeTax } from "@/lib/tax";
import { formatCurrency, formatPercent } from "@/lib/format";

type TaxCalculatorProps = {
  initialMonthlyIncome: number;
};

export function TaxCalculator({ initialMonthlyIncome }: TaxCalculatorProps) {
  const [monthlyIncome, setMonthlyIncome] = useState(initialMonthlyIncome);
  const [annualBonus, setAnnualBonus] = useState(0);
  const [extraDeductions, setExtraDeductions] = useState(0);
  const [withholdingTax, setWithholdingTax] = useState(0);

  const tax = useMemo(
    () =>
      calculateThaiPersonalIncomeTax({
        annualBonus,
        extraDeductions,
        monthlyIncome,
        withholdingTax,
      }),
    [annualBonus, extraDeductions, monthlyIncome, withholdingTax],
  );
  const hasRefund = tax.refundAmount > 0;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Thai Personal Income Tax</CardTitle>
            <CardDescription>
              ประมาณการภาษีเงินได้บุคคลธรรมดาจากเงินเดือน โบนัส และค่าลดหย่อน
            </CardDescription>
          </div>
          <Badge className="w-fit bg-[var(--muted)] text-[var(--muted-foreground)]">
            <ReceiptText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            ปีภาษีปัจจุบัน
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid min-w-0 gap-4 min-[1150px]:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
          <div className="grid min-w-0 gap-4 rounded-lg border border-[var(--border)] p-4">
            <MoneyInput
              id="tax-monthly-income"
              label="รายได้ต่อเดือนก่อนหักภาษี"
              onChange={setMonthlyIncome}
              value={monthlyIncome}
            />
            <MoneyInput
              id="tax-annual-bonus"
              label="โบนัส/รายได้เพิ่มต่อปี"
              onChange={setAnnualBonus}
              value={annualBonus}
            />
            <MoneyInput
              id="tax-extra-deductions"
              label="ค่าลดหย่อนเพิ่มเติม"
              onChange={setExtraDeductions}
              value={extraDeductions}
            />
            <MoneyInput
              id="tax-withholding"
              label="ภาษีหัก ณ ที่จ่ายทั้งปี"
              onChange={setWithholdingTax}
              value={withholdingTax}
            />
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
              <Metric label="รายได้ทั้งปี" value={formatCurrency(tax.annualIncome)} />
              <Metric label="เงินได้สุทธิ" value={formatCurrency(tax.taxableIncome)} />
              <Metric label="ภาษีก่อนเครดิต" value={formatCurrency(tax.grossTax)} />
              <Metric
                label={hasRefund ? "คาดว่าได้คืน" : "ต้องจ่ายเพิ่ม"}
                tone={hasRefund ? "success" : tax.taxPayable > 0 ? "danger" : "default"}
                value={formatCurrency(hasRefund ? tax.refundAmount : tax.taxPayable)}
              />
            </div>

            <div className="grid gap-3 rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                <h3 className="text-sm font-semibold">สรุปการหักลดหย่อน</h3>
              </div>
              <SummaryRow
                label="หักค่าใช้จ่ายเงินเดือน 50% ไม่เกิน 100,000"
                value={tax.employmentExpenseDeduction}
              />
              <SummaryRow label="หักค่าลดหย่อนส่วนตัว" value={tax.personalAllowance} />
              <SummaryRow label="หักค่าลดหย่อนเพิ่มเติม" value={extraDeductions} />
              <SummaryRow emphasized label="รวมรายการหัก" value={tax.totalDeductions} />
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem_9rem] bg-[var(--muted)] px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)]">
                <span>ฐานภาษี</span>
                <span className="text-right">อัตรา</span>
                <span className="text-right">ภาษี</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {tax.bracketBreakdown.map((bracket) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_7rem_9rem] px-4 py-3 text-sm"
                    key={`${bracket.from}-${bracket.to ?? "up"}`}
                  >
                    <span className="min-w-0">
                      {formatBracketRange(bracket.from, bracket.to)}
                    </span>
                    <span className="text-right">{formatPercent(bracket.rate * 100, 0)}</span>
                    <span className="text-right font-medium">{formatCurrency(bracket.tax)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MoneyInput({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={roundInput(value)}
      />
    </div>
  );
}

function Metric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "danger" | "success";
  value: string;
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--destructive)]"
      : tone === "success"
        ? "text-[var(--success-soft-foreground)]"
        : "text-[var(--foreground)]";

  return (
    <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className={`mt-2 text-lg font-semibold leading-snug sm:text-xl ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  emphasized = false,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${
        emphasized ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
      }`}
    >
      <span>{label}</span>
      <span className="shrink-0">{formatCurrency(value)}</span>
    </div>
  );
}

function formatBracketRange(from: number, to: number | null) {
  if (to === null) return `${formatCurrency(from)} ขึ้นไป`;
  if (from === 0) return `0 - ${formatCurrency(to)}`;
  return `${formatCurrency(from + 1)} - ${formatCurrency(to)}`;
}

function roundInput(value: number) {
  return Number(value.toFixed(2));
}
