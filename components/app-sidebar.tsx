"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Settings2,
  ExternalLink,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigation = [
  { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "Estudantes", url: "/admin/estudantes", icon: <Users /> },
  { title: "Configurações", url: "/admin/configuracoes", icon: <Settings2 /> },
]

export function AppSidebar({
  administrator,
  ...props
}: ComponentProps<typeof Sidebar> & {
  administrator: { name: string; username: string }
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin/dashboard" />}
            >
              <GraduationCap />
              <span>SIGA · Inscrições</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
        <NavSecondary
          className="mt-auto"
          items={[
            {
              title: "Formulário de inscrição",
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
