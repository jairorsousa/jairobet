import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlertCount } from "@/features/alerts/actions";

export async function AlertsBell() {
  const count = await getAlertCount();

  return (
    <Link href="/alertas" aria-label={`${count} alertas`}>
      <Button variant="ghost" size="icon-sm" className="relative">
        <Bell className="size-5" />
        {count > 0 ? (
          <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center border-0 bg-destructive p-0 text-[10px] text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </Badge>
        ) : null}
      </Button>
    </Link>
  );
}