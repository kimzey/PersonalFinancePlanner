import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SummaryCards } from "@/components/finance/summary-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateAllocationTotals,
  calculateRemainingIncome,
} from "@/lib/finance";
import { createDefaultPlan } from "@/lib/default-plan";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function Home() {
  const plan = createDefaultPlan();
  const totals = calculateAllocationTotals(plan.allocations);
  const remaining = calculateRemainingIncome(plan.profile.netIncome, totals.amount);
  const isOverIncome = remaining < 0;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Personal Finance Planner
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Dashboard สำหรับวางแผนรายได้ ค่าใช้จ่าย การออม และการลงทุนรายเดือน
            </p>
          </div>
          <Badge className="w-fit bg-teal-100 text-teal-900">Phase 2 Dashboard</Badge>
        </header>

        <SummaryCards
          netIncome={plan.profile.netIncome}
          remaining={remaining}
          totals={totals}
        />

        {isOverIncome ? (
          <Alert variant="destructive">
            <AlertTitle>ยอดจัดสรรเกินรายได้</AlertTitle>
            <AlertDescription>
              แผนนี้เกินรายได้สุทธิอยู่ {formatCurrency(Math.abs(remaining))}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>แผนตั้งต้นสมดุล</AlertTitle>
            <AlertDescription>
              ยอดจัดสรรรวม {formatPercent(totals.percent)} และเงินเหลือ{" "}
              {formatCurrency(remaining)}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>แผนตั้งต้น</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {plan.allocations.map((allocation) => (
              <div
                className="grid gap-2 rounded-md border border-[var(--border)] p-3 sm:grid-cols-[1fr_auto_auto]"
                key={allocation.id}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: allocation.color }}
                  />
                  <div>
                    <div className="font-medium text-slate-900">{allocation.name}</div>
                    <div className="text-xs text-slate-500">{allocation.note}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-900 sm:text-right">
                  {formatCurrency(allocation.amount)}
                </div>
                <div className="text-sm text-slate-600 sm:text-right">
                  {formatPercent(allocation.percent)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
