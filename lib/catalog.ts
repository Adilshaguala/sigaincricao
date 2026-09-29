import "server-only"

import { prisma } from "@/lib/prisma"

export async function getCatalog() {
  const [availableCourses, availableCenters] = await Promise.all([
    prisma.course.findMany({
      where: {
        active: true,
        resourceCenters: { some: { resourceCenter: { active: true } } },
      },
      include: {
        resourceCenters: {
          where: { resourceCenter: { active: true } },
          select: { resourceCenterId: true },
        },
      },
      orderBy: [{ name: "asc" }, { plan: "asc" }],
    }),
    prisma.resourceCenter.findMany({
      where: {
        active: true,
        courses: { some: { course: { active: true } } },
      },
      select: { id: true, name: true, location: true },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    courses: availableCourses.map((course) => ({
      id: course.id,
      name: course.name,
      plan: course.plan,
      shortName: course.shortName,
      centerIds: course.resourceCenters.map((link) => link.resourceCenterId),
    })),
    centers: availableCenters,
  }
}
