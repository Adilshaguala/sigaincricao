import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/admin-auth"

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const administrator = await requireAdmin()

  return (
    <AdminShell
      administrator={{ name: administrator.name, username: administrator.username }}
    >
      {children}
    </AdminShell>
  )
}
