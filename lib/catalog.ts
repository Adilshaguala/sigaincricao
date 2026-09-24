import "server-only"

import { prisma } from "@/lib/prisma"

const courses = [
  { id: "gestao", name: "Licenciatura em Gestão", shortName: "LG" },
  {
    id: "contabilidade",
    name: "Licenciatura em Contabilidade e Auditoria",
    shortName: "LCA",
  },
  {
    id: "administracao-publica",
    name: "Licenciatura em Administração Pública",
    shortName: "LAP",
  },
  {
    id: "informatica-gestao",
    name: "Licenciatura em Informática de Gestão",
    shortName: "LIG",
  },
]

const resourceCenters = [
  { id: "maputo", name: "Centro de Recursos de Maputo", location: "Maputo Cidade" },
  { id: "matola", name: "Centro de Recursos da Matola", location: "Província de Maputo" },
  { id: "xai-xai", name: "Centro de Recursos de Xai-Xai", location: "Gaza" },
  { id: "beira", name: "Centro de Recursos da Beira", location: "Sofala" },
  { id: "nampula", name: "Centro de Recursos de Nampula", location: "Nampula" },
]

export async function getCatalog() {
  await prisma.$transaction([
    ...courses.map((course) =>
      prisma.course.upsert({
        where: { id: course.id },
        update: course,
        create: course,
      }),
    ),
    ...resourceCenters.map((center) =>
      prisma.resourceCenter.upsert({
        where: { id: center.id },
        update: center,
        create: center,
      }),
    ),
  ])

  const [availableCourses, availableCenters] = await Promise.all([
    prisma.course.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.resourceCenter.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ])

  return { courses: availableCourses, centers: availableCenters }
}
