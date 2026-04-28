import { motion, useReducedMotion } from "framer-motion";
import { Banknote, Landmark, PiggyBank, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationTotals } from "@/types/finance";

type SummaryCardsProps = {
  netIncome: number;
  totals: AllocationTotals;
  remaining: number;
};

const cardClasses = [
  "border-l-4 border-l-blue-600",
  "border-l-4 border-l-red-600",
  "border-l-4 border-l-emerald-600",
  "border-l-4 border-l-cyan-600",
];

export function SummaryCards({ netIncome, totals, remaining }: SummaryCardsProps) {
  const shouldReduceMotion = useReducedMotion();
  const savingAndInvestment = totals.savingsAmount + totals.investmentAmount;
  const items = [
    {
      title: "รายได้สุทธิรายเดือน",
      value: formatCurrency(netIncome),
      detail: "ฐานคำนวณแผนทั้งหมด",
      icon: Banknote,
    },
    {
      title: "ค่าใช้จ่ายรวม",
      value: formatCurrency(totals.amount),
      detail: formatPercent(totals.percent),
      icon: WalletCards,
    },
    {
      title: "เงินออม/ลงทุนรวม",
      value: formatCurrency(savingAndInvestment),
      detail: formatPercent((savingAndInvestment / netIncome) * 100),
      icon: PiggyBank,
    },
    {
      title: remaining >= 0 ? "เงินเหลือ" : "เงินขาด",
      value: formatCurrency(remaining),
      detail: remaining >= 0 ? "ยังจัดสรรเพิ่มได้" : "เกินรายได้สุทธิ",
      icon: Landmark,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            key={item.title}
            transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: 0.18 }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
          >
          <Card className={`${cardClasses[index]} h-full transition-shadow hover:shadow-md`}>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="text-sm text-[var(--muted-foreground)]">
                {item.title}
              </CardTitle>
              <Icon className="h-5 w-5 text-[var(--muted-foreground)]" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--foreground)]">
                {item.value}
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {item.detail}
              </p>
            </CardContent>
          </Card>
          </motion.div>
        );
      })}
    </section>
  );
}
