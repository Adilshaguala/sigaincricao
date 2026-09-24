import {
  ChartAreaInteractive,
  DistributionCharts,
} from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { getDashboardData } from "@/lib/admin-data"

export default async function DashboardPage() {
  const data = await getDashboardData()
  const dateFormatter = new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  })
  return (
    <>
      <SectionCards data={data} />
      <ChartAreaInteractive data={data.monthlyTrend} />
      <DistributionCharts
        courseCounts={data.courseCounts}
        centerCounts={data.centerCounts}
        genderCounts={data.genderCounts}
      />
      <DataTable
        data={data.recentApplications.map((application) => ({
          id: application.id,
          studentId: application.user.id,
          name: application.user.fullName,
          course: application.course.shortName,
          center: application.resourceCenter.name,
          submittedAt: dateFormatter.format(application.submittedAt),
        }))}
      />
    </>
  )
}
