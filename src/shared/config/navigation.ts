import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Scale,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/titulares", label: "Titulares", icon: Users },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/movimentacoes", label: "Movimentações", icon: BarChart3 },
  { href: "/transferencias", label: "Transferências", icon: ArrowLeftRight },
  { href: "/conciliacao", label: "Conciliação", icon: Scale },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;