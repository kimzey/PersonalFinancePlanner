import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { createDefaultPlan } from "@/lib/default-plan";

export default function Home() {
  const plan = createDefaultPlan();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <FinanceDashboard initialPlan={plan} />
    </main>
  );
}
