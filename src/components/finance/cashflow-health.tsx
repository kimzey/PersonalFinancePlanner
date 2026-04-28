"use client";

import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assessCashflowHealth } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationTotals } from "@/types/finance";

type CashflowHealthProps = {
  netIncome: number;
  totals: AllocationTotals;
  remaining: number;
};

export function CashflowHealth({ netIncome, totals, remaining }: CashflowHealthProps) {
  const health = assessCashflowHealth({ netIncome, totals, remaining });
  const StatusIcon = health.status === "ดี" ? CheckCircle2 : AlertTriangle;
  const badgeClass =
    health.status === "ดี"
      ? "bg-[var(--success-soft)] text-[var(--success-soft-foreground)]"
      : "bg-[var(--danger-soft)] text-[var(--danger-soft-foreground)]";

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Cashflow Health</CardTitle>
            <CardDescription>
              ตรวจความตึงของรายเดือนจากเงินออม การลงทุน และค่าใช้จ่ายจำเป็น
            </CardDescription>
          </div>
          <Badge className={`w-fit ${badgeClass}`}>
            <StatusIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {health.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <RatioMeter
            label="Savings rate"
            value={health.savingsRate}
            helper={formatCurrency(totals.savingsAmount)}
          />
          <RatioMeter
            label="Investment rate"
            value={health.investmentRate}
            helper={formatCurrency(totals.investmentAmount)}
          />
          <RatioMeter
            label="Fixed cost ratio"
            value={health.fixedCostRatio}
            helper={formatCurrency(totals.essentialAmount)}
          />
        </div>

        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
              เงินเหลือหลังจัดสรร
            </div>
            <div className={remaining < 0 ? "font-semibold text-[var(--destructive)]" : "font-semibold"}>
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>

        {health.warnings.length > 0 ? (
          <Alert variant={health.status === "เสี่ยง" ? "destructive" : "default"}>
            <AlertTitle>คำเตือนจากแผนปัจจุบัน</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 grid gap-1.5 pl-5">
                {health.warnings.map((warning) => (
                  <li className="list-disc" key={warning}>
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>สถานะดี</AlertTitle>
            <AlertDescription>
              Cashflow ยังมีสัดส่วนออมและค่าใช้จ่ายจำเป็นอยู่ในกรอบที่ยืดหยุ่น
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function RatioMeter({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  const width = `${Math.min(100, Math.max(0, value))}%`;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
          <div className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {formatPercent(value)}
          </div>
        </div>
        <div className="text-right text-xs text-[var(--muted-foreground)]">{helper}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--card)]">
        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width }} />
      </div>
    </div>
  );
}
