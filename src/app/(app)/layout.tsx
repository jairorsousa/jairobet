import {
  BottomNav,
  DesktopSidebar,
} from "@/shared/components/layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DesktopSidebar />
      {children}
      <BottomNav />
    </div>
  );
}