"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const pathname = usePathname()
  const title = pathname.startsWith("/admin/configuracoes")
    ? "Configurações"
    : pathname.startsWith("/admin/estudantes/")
      ? "Dados do estudante"
      : pathname.startsWith("/admin/estudantes")
        ? "Estudantes inscritos"
        : "Dashboard"
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger aria-label="Abrir ou fechar menu" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{title}</h1>
        {pathname === "/admin/dashboard" && (
          <Button
            className="ml-auto"
            variant="outline"
            size="sm"
            render={
              <Link
                href="/admin/estudantes/exportar"
                prefetch={false}
                download
              />
            }
            nativeButton={false}
          >
            <Download />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sr-only sm:hidden">Exportar Excel</span>
          </Button>
        )}
      </div>
    </header>
  )
}
