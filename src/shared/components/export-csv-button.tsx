import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportCsvButtonProps {
  href: string;
  label?: string;
}

export function ExportCsvButton({
  href,
  label = "Exportar CSV",
}: ExportCsvButtonProps) {
  return (
    <a
      href={href}
      download
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <Download className="size-4" />
      {label}
    </a>
  );
}