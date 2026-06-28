interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 px-4 py-6 pb-24 md:px-6 lg:ml-64 lg:px-8 lg:pb-6">
      {children}
    </main>
  );
}