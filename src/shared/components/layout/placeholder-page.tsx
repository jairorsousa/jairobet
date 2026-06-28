import { Header, PageContainer } from "@/shared/components/layout";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  return (
    <>
      <Header title={title} icon={icon} />
      <PageContainer>
        <div className="glass-card rounded-xl border border-border/50 p-8 text-center animate-fade-in">
          <p className="text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Disponível na próxima sprint.
          </p>
        </div>
      </PageContainer>
    </>
  );
}