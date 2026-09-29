import { StudentsTable } from "@/components/admin/students-table"
import { getStudents } from "@/lib/admin-data"

export default async function StudentsPage() {
  const data = await getStudents()

  return <StudentsTable {...data} />
}
