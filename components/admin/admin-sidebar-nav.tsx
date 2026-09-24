"use client"

import Link from "next/link"
import { LayoutDashboard, Settings2, UsersRound } from "lucide-react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/estudantes", label: "Estudantes", icon: UsersRound },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings2 },
]

export function AdminSidebarNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={cn(mobile ? "flex gap-2 overflow-x-auto" : "grid gap-1.5")}>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              mobile
                ? active
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
                : active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
