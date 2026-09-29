"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  Settings2,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Prazo das candidaturas",
    url: "/admin/configuracoes",
    icon: CalendarClock,
  },
  { title: "Cursos", url: "/admin/configuracoes/cursos", icon: BookOpen },
  {
    title: "Centros de recursos",
    url: "/admin/configuracoes/centros",
    icon: Building2,
  },
]

export function SettingsNav() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const active = pathname.startsWith("/admin/configuracoes")

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Collapsible defaultOpen={active} className="group/settings">
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    isActive={active}
                    aria-label="Configurações"
                  />
                }
              >
                <Settings2 />
                <span>Configurações</span>
                <ChevronDown className="ml-auto transition-transform group-data-open/settings:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {items.map((item) => {
                    const selected =
                      pathname === item.url ||
                      (item.url !== "/admin/configuracoes" &&
                        pathname.startsWith(item.url + "/"))
                    return (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          render={<Link href={item.url} />}
                          isActive={selected}
                          aria-current={selected ? "page" : undefined}
                          onClick={() => setOpenMobile(false)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
