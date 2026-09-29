import { notFound } from "next/navigation"

import { CenterCreateForm } from "@/components/admin/catalog-forms"
import { CenterCoursesPanel } from "@/components/admin/center-courses-panel"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export default async function CenterDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [center, allCourses] = await Promise.all([
    prisma.resourceCenter.findFirst({
      where: { id, active: true },
      include: {
        courses: {
          include: {
            course: { include: { academicLevel: { select: { name: true } } } },
          },
        },
        _count: { select: { applications: true } },
      },
    }),
    prisma.course.findMany({
      where: { active: true },
      include: { academicLevel: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ])
  if (!center) notFound()

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="w-full max-w-3xl">
        <CenterCreateForm
          center={{
            id: center.id,
            name: center.name,
            location: center.location,
          }}
        />
      </div>
      <section className="min-w-0">
        <h2 className="text-lg font-bold">Cursos do centro</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Visualize os cursos associados a este centro.
        </p>
        <CenterCoursesPanel
          centerId={center.id}
          courses={center.courses
            .filter((link) => link.course.active)
            .map((link) => ({
              id: link.course.id,
              name: link.course.name,
              plan: link.course.plan,
              duration: link.course.duration,
              levelName: link.course.academicLevel?.name ?? null,
            }))}
          allCourses={allCourses.map((course) => ({
            id: course.id,
            name: course.name,
            plan: course.plan,
            duration: course.duration,
            levelName: course.academicLevel?.name ?? null,
          }))}
        />
      </section>
    </div>
  )
}
