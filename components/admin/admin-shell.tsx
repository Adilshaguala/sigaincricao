import type { CSSProperties, ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AdminShell({
  administrator,
  children,
}: {
  administrator: { name: string; username: string }
  children: ReactNode
}) {
  return (
    <TooltipProvider>
      <SidebarProvider
        className="h-svh min-h-0 overflow-hidden"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar administrator={administrator} />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <SiteHeader />
          <div className="@container/main flex min-h-0 flex-1 flex-col overflow-auto p-4 lg:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
