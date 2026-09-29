import { CourseCreateForm } from "@/components/admin/catalog-forms"
import { getCourseSettingsData } from "@/lib/admin-data"

export default async function NewCoursePage() {
  const { centers, levels } = await getCourseSettingsData()
  return (
    <div className="flex flex-1 justify-center">
      <CourseCreateForm centers={centers} levels={levels} />
    </div>
  )
}
