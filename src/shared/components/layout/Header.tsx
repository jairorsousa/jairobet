import { ThemeSwitcher } from "@/shared/components/ui/theme-switcher";

interface HeaderProps {
  title: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function Header({ title, icon, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:ml-64">
        <span className="font-heading text-lg font-bold lg:hidden text-gradient-gold">
          JairoBet
        </span>
        <div className="hidden items-center gap-2 sm:flex">
          {icon}
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightAction}
        <ThemeSwitcher />
      </div>
    </header>
  );
}