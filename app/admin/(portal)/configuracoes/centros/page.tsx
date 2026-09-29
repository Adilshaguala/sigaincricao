import { CentersSettingsTable } from "@/components/admin/centers-settings-table"
import { getCenterSettingsData } from "@/lib/admin-data"

export default async function CentersPage() {
  const { centers } = await getCenterSettingsData()
  return (
    <CentersSettingsTable
      centers={centers.map((center) => ({
        id: center.id,
        name: center.name,
        location: center.location,
        isMainCampus: center.isMainCampus,
        applications: center._count.applications,
        courses: center._count.courses,
      }))}
    />
  )
}
