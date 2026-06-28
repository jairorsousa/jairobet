import {
  ArrowLeftRight,
  BarChart3,
  Bitcoin,
  Landmark,
  LayoutDashboard,
  Scale,
  Settings,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/titulares", label: "Titulares", icon: Users },
  { href: "/bancos", label: "Bancos", icon: Landmark },
  { href: "/corretoras", label: "Corretoras", icon: Bitcoin },
  { href: "/casas-apostas", label: "Casas de apostas", icon: Trophy },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/movimentacoes", label: "Movimentações", icon: BarChart3 },
  { href: "/transferencias", label: "Transferências", icon: ArrowLeftRight },
  { href: "/conciliacao", label: "Conciliação", icon: Scale },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;