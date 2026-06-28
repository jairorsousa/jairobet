"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/shared/config/navigation";

const mobileHrefs = new Set([
  "/",
  "/titulares",
  "/contas",
  "/movimentacoes",
  "/transferencias",
]);

const mobileItems = navItems.filter((item) => mobileHrefs.has(item.href));

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate max-w-[4rem]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}