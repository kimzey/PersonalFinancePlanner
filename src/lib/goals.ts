import type { FinancialGoal } from "@/types/finance";

export type GoalProgress = {
  remainingAmount: number;
  progressPercent: number;
  monthsToTarget: number | null;
  requiredMonthlySaving: number;
  projectedMonthlySaving: number;
  status: "on-track" | "behind" | "complete" | "undated";
};

export function evaluateGoal(
  goal: FinancialGoal,
  currentDate = new Date(),
): GoalProgress {
  const targetAmount = Math.max(0, goal.targetAmount);
  const currentAmount = Math.max(0, goal.currentAmount);
  const projectedMonthlySaving = Math.max(0, goal.monthlySaving);
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const monthsToTarget = goal.targetDate
    ? countMonthsUntil(goal.targetDate, currentDate)
    : null;
  const requiredMonthlySaving =
    remainingAmount === 0
      ? 0
      : monthsToTarget && monthsToTarget > 0
        ? remainingAmount / monthsToTarget
        : remainingAmount;

  return {
    remainingAmount,
    progressPercent: targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0,
    monthsToTarget,
    requiredMonthlySaving,
    projectedMonthlySaving,
    status:
      remainingAmount === 0
        ? "complete"
        : monthsToTarget === null
          ? "undated"
          : projectedMonthlySaving >= requiredMonthlySaving
            ? "on-track"
            : "behind",
  };
}

export function countMonthsUntil(targetDate: string, currentDate = new Date()) {
  const target = new Date(`${targetDate}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  const yearDiff = target.getFullYear() - currentDate.getFullYear();
  const monthDiff = target.getMonth() - currentDate.getMonth();
  const dayAdjustment = target.getDate() >= currentDate.getDate() ? 0 : -1;

  return Math.max(0, yearDiff * 12 + monthDiff + dayAdjustment);
}
