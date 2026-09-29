import { CoursesSettingsTable } from "@/components/admin/courses-settings-table"
import { getCourseSettingsData } from "@/lib/admin-data"

export default async function CoursesPage() {
  const data = await getCourseSettingsData()
  return (
    <CoursesSettingsTable
      courses={data.courses.map((course) => ({
        id: course.id,
        name: course.name,
        plan: course.plan,
        duration: course.duration,
        levelId: course.academicLevelId,
        levelName: course.academicLevel?.name ?? null,
        centerIds: course.resourceCenters.map((link) => link.resourceCenterId),
        centerNames: course.resourceCenters.map(
          (link) => link.resourceCenter.name
        ),
        applications: course._count.applications,
      }))}
      centers={data.centers}
      levels={data.levels}
    />
  )
}
