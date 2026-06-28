import { PageContainer } from "@/shared/components/layout";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

export default function AppLoading() {
  return (
    <PageContainer>
      <DashboardSkeleton />
    </PageContainer>
  );
}