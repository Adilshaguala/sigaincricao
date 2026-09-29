import { notFound } from "next/navigation"

import { CourseCreateForm } from "@/components/admin/catalog-forms"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [course, centers, levels] = await Promise.all([
    prisma.course.findFirst({
      where: { id, active: true },
      include: {
        academicLevel: true,
        resourceCenters: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.resourceCenter.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicLevel.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])
  if (!course) notFound()

  return (
    <div className="mx-auto mt-5 w-full max-w-5xl">
      <CourseCreateForm
        centers={centers}
        levels={levels}
        course={{
          id: course.id,
          name: course.name,
          plan: course.plan,
          duration: course.duration,
          levelId: course.academicLevelId,
          centerIds: course.resourceCenters.map(
            (link) => link.resourceCenterId
          ),
        }}
      />
    </div>
  )
}
