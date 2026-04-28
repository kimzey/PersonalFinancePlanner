"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAllocationTotals } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationCategory } from "@/types/finance";

type AllocationChartProps = {
  allocations: AllocationCategory[];
};

type ChartPoint = AllocationCategory & {
  value: number;
};

type AllocationTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: ChartPoint;
  }>;
};

const fallbackColors = [
  "#0f766e",
  "#c2410c",
  "#7c3aed",
  "#0369a1",
  "#be123c",
  "#4d7c0f",
  "#0891b2",
  "#f59e0b",
];

export function AllocationChart({ allocations }: AllocationChartProps) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const visibleAllocations = allocations.filter(
    (category) => !hiddenIds.includes(category.id),
  );
  const visibleTotals = calculateAllocationTotals(visibleAllocations);
  const chartData = visibleAllocations
    .filter((category) => category.amount > 0)
    .map((category) => ({
      ...category,
      value: category.amount,
    }));

  function toggleCategory(id: string) {
    setHiddenIds((current) =>
      current.includes(id)
        ? current.filter((hiddenId) => hiddenId !== id)
        : [...current, id],
    );
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>สัดส่วนการจัดสรร</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {formatCurrency(visibleTotals.amount)} จากหมวดที่แสดงอยู่{" "}
              {formatPercent(visibleTotals.percent)}
            </p>
          </div>
          <div className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
            {chartData.length} หมวด
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[minmax(18rem,0.9fr)_1.1fr] xl:items-center">
        <div className="h-72 min-w-0 sm:h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  animationDuration={450}
                  data={chartData}
                  dataKey="value"
                  innerRadius="58%"
                  isAnimationActive
                  nameKey="name"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={3}
                >
                  {chartData.map((category, index) => (
                    <Cell
                      fill={category.color ?? fallbackColors[index % fallbackColors.length]}
                      key={category.id}
                    />
                  ))}
                </Pie>
                <Tooltip content={<AllocationTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
              ไม่มีหมวดที่แสดงในกราฟ
            </div>
          )}
        </div>

        <div className="grid max-h-[22rem] gap-2 overflow-auto pr-1">
          {allocations.map((category, index) => {
            const isHidden = hiddenIds.includes(category.id);
            const Icon = isHidden ? EyeOff : Eye;

            return (
              <button
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left transition-colors hover:bg-[var(--muted)]"
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                type="button"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      category.color ?? fallbackColors[index % fallbackColors.length],
                  }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                    {category.name}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatCurrency(category.amount)} · {formatPercent(category.percent)}
                  </span>
                </span>
                <Icon
                  className="h-4 w-4 text-[var(--muted-foreground)]"
                  aria-hidden="true"
                />
              </button>
            );
          })}
          <Button onClick={() => setHiddenIds([])} size="sm" type="button" variant="secondary">
            แสดงทุกหมวด
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AllocationTooltip({ active, payload }: AllocationTooltipProps) {
  if (!active || !payload?.length) return null;

  const category = payload[0].payload as ChartPoint;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] shadow-lg">
      <div className="font-medium">{category.name}</div>
      <div className="mt-1 text-[var(--muted-foreground)]">
        {formatCurrency(category.amount)} · {formatPercent(category.percent)}
      </div>
    </div>
  );
}
