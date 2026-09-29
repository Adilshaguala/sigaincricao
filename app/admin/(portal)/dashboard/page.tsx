import {
  ChartAreaInteractive,
  DistributionCharts,
  GenderDistributionChart,
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
    <main className="flex flex-col gap-6">
      <section
        aria-labelledby="dashboard-title"
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div className="grid gap-1">
          <h1
            id="dashboard-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Visão geral
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as candidaturas submetidas e a procura por formação.
          </p>
        </div>
      </section>
      <SectionCards data={data} />
      <section className="grid gap-6 @5xl/main:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
        <ChartAreaInteractive data={data.monthlyTrend} />
        <GenderDistributionChart data={data.genderCounts} />
      </section>
      <DistributionCharts
        courseCounts={data.courseCounts}
        centerCounts={data.centerCounts}
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
    </main>
  )
}
