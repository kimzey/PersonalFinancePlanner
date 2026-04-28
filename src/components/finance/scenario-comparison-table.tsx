"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateDcaFutureValue,
  calculateTotalContribution,
} from "@/lib/finance";
import { formatCurrency } from "@/lib/format";

type ScenarioComparisonTableProps = {
  annualReturnPercent: number;
  initialAmount: number;
  years: number;
};

const comparisonContributions = [8_000, 10_000, 20_000];

export function ScenarioComparisonTable({
  annualReturnPercent,
  initialAmount,
  years,
}: ScenarioComparisonTableProps) {
  const baseFutureValue = calculateDcaFutureValue(
    initialAmount,
    comparisonContributions[0],
    annualReturnPercent,
    years,
  );

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DCA/เดือน</TableHead>
            <TableHead>เงินต้นรวม</TableHead>
            <TableHead>มูลค่าอนาคต</TableHead>
            <TableHead>กำไรคาดการณ์</TableHead>
            <TableHead>ต่างจาก 8k</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonContributions.map((monthlyContribution) => {
            const totalContribution = calculateTotalContribution(
              initialAmount,
              monthlyContribution,
              years,
            );
            const futureValue = calculateDcaFutureValue(
              initialAmount,
              monthlyContribution,
              annualReturnPercent,
              years,
            );
            const estimatedGain = futureValue - totalContribution;
            const differenceFromBase = futureValue - baseFutureValue;

            return (
              <TableRow key={monthlyContribution}>
                <TableCell className="font-medium">
                  {formatCurrency(monthlyContribution)}
                </TableCell>
                <TableCell>{formatCurrency(totalContribution)}</TableCell>
                <TableCell>{formatCurrency(futureValue)}</TableCell>
                <TableCell>{formatCurrency(estimatedGain)}</TableCell>
                <TableCell>{formatCurrency(differenceFromBase)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
