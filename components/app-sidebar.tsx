"use client"

import type { ComponentProps } from "react"
import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, Users, ExternalLink } from "lucide-react"
import { SettingsNav } from "@/components/admin/settings-nav"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const navigation = [
  { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "Estudantes", url: "/admin/estudantes", icon: <Users /> },
]

export function AppSidebar({
  administrator,
  ...props
}: ComponentProps<typeof Sidebar> & {
  administrator: { name: string; username: string }
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex-row items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="flex min-w-0 items-center gap-2 px-2 py-1 text-sidebar-foreground"
        >
          <Image
            src="/ISAD.png"
            width={90}
            height={53}
            alt="ISAD"
            sizes="90px"
          />
          <Image
            src="/up_logo.png"
            width={90}
            height={53}
            alt="Universidade Pedagógica"
            sizes="90px"
          />
        </Link>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
        <SettingsNav />
        <NavSecondary
          className="mt-auto"
          items={[
            {
              title: "Formulário de candidatura",
              url: "/",
              icon: <ExternalLink />,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={administrator} />
      </SidebarFooter>
    </Sidebar>
  )
}
