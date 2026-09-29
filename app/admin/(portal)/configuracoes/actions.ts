"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { parseMaputoDateTime, SETTINGS_ID } from "@/lib/registration-settings"

export type ConfigurationActionState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[] | undefined>
  revision?: number
}

const courseSchema = z.object({
  name: z.string().trim().min(3, "Introduza o nome completo do curso."),
  plan: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/, "Indique uma letra de A a Z para o plano."),
  duration: z.coerce
    .number<number>()
    .int()
    .min(2, "A duração mínima é de 2 anos.")
    .max(8, "A duração máxima é de 8 anos."),
  academicLevelId: z.string().min(1, "Seleccione o grau académico."),
  centerIds: z
    .array(z.string())
    .min(1, "Seleccione pelo menos um centro de recursos."),
})

const centerSchema = z.object({
  name: z.string().trim().min(3, "Introduza o nome do centro."),
  location: z.string().trim().min(2, "Introduza a localização do centro."),
})

function textValue(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function courseShortName(name: string, plan: string) {
  const initials = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(
      (word) => !["DE", "DA", "DO", "EM", "E"].includes(word.toUpperCase())
    )
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 10)
  return `${initials || "CURSO"}${plan}`
}

async function availableId(model: "course" | "center", source: string) {
  const base = slugify(source) || model
  const exists =
    model === "course"
      ? await prisma.course.findUnique({
          where: { id: base },
          select: { id: true },
        })
      : await prisma.resourceCenter.findUnique({
          where: { id: base },
          select: { id: true },
        })

  return exists ? `${base}-${Date.now().toString(36)}` : base
}

function revalidateConfiguration() {
  revalidatePath("/admin/configuracoes")
  revalidatePath("/admin/configuracoes/cursos")
  revalidatePath("/admin/configuracoes/centros")
  revalidatePath("/admin/dashboard")
  revalidatePath("/")
  revalidatePath("/inscricao")
}

export async function updateRegistrationPeriod(
  _state: ConfigurationActionState,
  formData: FormData
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const startValue = textValue(formData, "registrationStart")
  const endValue = textValue(formData, "registrationEnd")
  const start = startValue ? parseMaputoDateTime(startValue) : null
  const end = endValue ? parseMaputoDateTime(endValue) : null
  const fieldErrors: ConfigurationActionState["fieldErrors"] = {}

  if (startValue && !start)
    fieldErrors.registrationStart = ["Indique uma data de abertura válida."]
  if (endValue && !end)
    fieldErrors.registrationEnd = ["Indique uma data de encerramento válida."]
  if (start && end && end <= start) {
    fieldErrors.registrationEnd = [
      "O encerramento deve ser posterior à abertura.",
    ]
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors }

  await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { registrationStart: start, registrationEnd: end },
    create: { id: SETTINGS_ID, registrationStart: start, registrationEnd: end },
  })

  revalidateConfiguration()
  return { success: "Prazo das candidaturas actualizado.", revision: Date.now() }
}

export async function createCourse(
  _state: ConfigurationActionState,
  formData: FormData
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const parsed = courseSchema.safeParse({
    name: textValue(formData, "name"),
    plan: textValue(formData, "plan").toUpperCase(),
    duration: textValue(formData, "duration"),
    academicLevelId: textValue(formData, "academicLevelId"),
    centerIds: formData
      .getAll("centerIds")
      .filter((value): value is string => typeof value === "string"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  const centerIds = [...new Set(parsed.data.centerIds)]
  const [existing, level, centers] = await Promise.all([
    prisma.course.findMany({ select: { name: true, plan: true } }),
    prisma.academicLevel.findFirst({
      where: { id: parsed.data.academicLevelId, active: true },
      select: { id: true },
    }),
    prisma.resourceCenter.findMany({
      where: { id: { in: centerIds }, active: true },
      select: { id: true },
    }),
  ])
  const name = parsed.data.name.replace(/\s+/g, " ")
  const duplicate = existing.some(
    (course) =>
      course.name.toLocaleLowerCase("pt") === name.toLocaleLowerCase("pt") &&
      course.plan?.toUpperCase() === parsed.data.plan
  )

  if (duplicate) {
    return { error: "Já existe um curso com este nome e plano." }
  }
  if (!level)
    return {
      fieldErrors: {
        academicLevelId: ["Seleccione um grau académico válido."],
      },
    }
  if (centers.length !== centerIds.length)
    return {
      fieldErrors: {
        centerIds: ["Seleccione centros de recursos activos e válidos."],
      },
    }

  await prisma.course.create({
    data: {
      id: await availableId("course", `${name}-${parsed.data.plan}`),
      name,
      shortName: courseShortName(name, parsed.data.plan),
      plan: parsed.data.plan,
      duration: parsed.data.duration,
      academicLevelId: level.id,
      resourceCenters: {
        create: centerIds.map((resourceCenterId) => ({ resourceCenterId })),
      },
    },
  })

  revalidateConfiguration()
  return { success: "Curso criado com sucesso.", revision: Date.now() }
}

export async function createResourceCenter(
  _state: ConfigurationActionState,
  formData: FormData
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const parsed = centerSchema.safeParse({
    name: textValue(formData, "name"),
    location: textValue(formData, "location"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  const existing = await prisma.resourceCenter.findMany({
    select: { name: true },
  })
  const name = parsed.data.name.toLocaleLowerCase("pt")
  if (existing.some((center) => center.name.toLocaleLowerCase("pt") === name)) {
    return { error: "Já existe um centro com este nome." }
  }

  await prisma.resourceCenter.create({
    data: {
      id: await availableId("center", parsed.data.name),
      name: parsed.data.name,
      location: parsed.data.location,
    },
  })

  revalidateConfiguration()
  return {
    success: "Centro de recursos criado com sucesso.",
    revision: Date.now(),
  }
}

export async function updateCourse(
  courseId: string,
  _state: ConfigurationActionState,
  formData: FormData
): Promise<ConfigurationActionState> {
  await requireAdmin()
  const parsed = courseSchema.safeParse({
    name: textValue(formData, "name"),
    plan: textValue(formData, "plan").toUpperCase(),
    duration: textValue(formData, "duration"),
    academicLevelId: textValue(formData, "academicLevelId"),
    centerIds: formData
      .getAll("centerIds")
      .filter((value): value is string => typeof value === "string"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  const course = await prisma.course.findFirst({
    where: { id: courseId, active: true },
    select: { id: true },
  })
  if (!course) return { error: "Curso não encontrado." }
  const centerIds = [...new Set(parsed.data.centerIds)]
  const [duplicates, level, centers] = await Promise.all([
    prisma.course.findMany({
      where: { id: { not: courseId } },
      select: { name: true, plan: true },
    }),
    prisma.academicLevel.findFirst({
      where: { id: parsed.data.academicLevelId, active: true },
      select: { id: true },
    }),
    prisma.resourceCenter.findMany({
      where: { id: { in: centerIds }, active: true },
      select: { id: true },
    }),
  ])
  const name = parsed.data.name.replace(/\s+/g, " ")
  if (
    duplicates.some(
      (item) =>
        item.name.toLocaleLowerCase("pt") === name.toLocaleLowerCase("pt") &&
        item.plan?.toUpperCase() === parsed.data.plan
    )
  )
    return { error: "Já existe um curso com este nome e plano." }
  if (!level)
    return {
      fieldErrors: {
        academicLevelId: ["Seleccione um grau académico válido."],
      },
    }
  if (centers.length !== centerIds.length)
    return {
      fieldErrors: {
        centerIds: ["Seleccione centros de recursos activos e válidos."],
      },
    }

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: {
        name,
        shortName: courseShortName(name, parsed.data.plan),
        plan: parsed.data.plan,
        duration: parsed.data.duration,
        academicLevelId: level.id,
      },
    })
    await tx.courseResourceCenter.deleteMany({ where: { courseId } })
    await tx.courseResourceCenter.createMany({
      data: centerIds.map((resourceCenterId) => ({
        courseId,
        resourceCenterId,
      })),
    })
  })
  revalidateConfiguration()
  revalidatePath(`/admin/configuracoes/cursos/${courseId}`)
  return { success: "Curso actualizado com sucesso.", revision: Date.now() }
}

export async function updateResourceCenter(
  centerId: string,
  _state: ConfigurationActionState,
  formData: FormData
): Promise<ConfigurationActionState> {
  await requireAdmin()
  const parsed = centerSchema.safeParse({
    name: textValue(formData, "name"),
    location: textValue(formData, "location"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  const center = await prisma.resourceCenter.findFirst({
    where: { id: centerId, active: true },
    select: { id: true },
  })
  if (!center) return { error: "Centro não encontrado." }
  const duplicate = await prisma.resourceCenter.findMany({
    where: { id: { not: centerId } },
    select: { name: true },
  })
  if (
    duplicate.some(
      (item) =>
        item.name.toLocaleLowerCase("pt") ===
        parsed.data.name.toLocaleLowerCase("pt")
    )
  )
    return { error: "Já existe um centro com este nome." }
  await prisma.resourceCenter.update({
    where: { id: centerId },
    data: { name: parsed.data.name, location: parsed.data.location },
  })
  revalidateConfiguration()
  revalidatePath(`/admin/configuracoes/centros/${centerId}`)
  return { success: "Centro actualizado com sucesso.", revision: Date.now() }
}

export async function toggleCourse(courseId: string, _formData: FormData) {
  await requireAdmin()
  void _formData
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return

  await prisma.course.update({
    where: { id: course.id },
    data: { active: !course.active },
  })
  revalidateConfiguration()
}

export async function toggleResourceCenter(
  centerId: string,
  _formData: FormData
) {
  await requireAdmin()
  void _formData
  const center = await prisma.resourceCenter.findUnique({
    where: { id: centerId },
  })
  if (!center) return
  if (center.active && center.isMainCampus) return

  await prisma.resourceCenter.update({
    where: { id: center.id },
    data: { active: !center.active },
  })
  revalidateConfiguration()
}

export async function promoteResourceCenter(centerId: string) {
  await requireAdmin()
  const center = await prisma.resourceCenter.findFirst({
    where: { id: centerId, active: true },
    select: { id: true },
  })
  if (!center) return

  await prisma.$transaction([
    prisma.resourceCenter.updateMany({
      where: { isMainCampus: true },
      data: { isMainCampus: false },
    }),
    prisma.resourceCenter.update({
      where: { id: center.id },
      data: { isMainCampus: true },
    }),
  ])
  revalidateConfiguration()
}

export async function deactivateCourses(ids: string[]) {
  await requireAdmin()
  const uniqueIds = [
    ...new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
  ]
  if (!uniqueIds.length)
    return { success: false, message: "Seleccione pelo menos um curso." }
  await prisma.course.updateMany({
    where: { id: { in: uniqueIds }, active: true },
    data: { active: false },
  })
  revalidateConfiguration()
  return { success: true }
}

export async function deactivateCenters(ids: string[]) {
  await requireAdmin()
  const uniqueIds = [
    ...new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
  ]
  if (!uniqueIds.length)
    return { success: false, message: "Seleccione pelo menos um centro." }
  const main = await prisma.resourceCenter.findFirst({
    where: { id: { in: uniqueIds }, active: true, isMainCampus: true },
  })
  if (main)
    return {
      success: false,
      message: "O centro principal não pode ser eliminado.",
    }
  await prisma.resourceCenter.updateMany({
    where: { id: { in: uniqueIds }, active: true, isMainCampus: false },
    data: { active: false },
  })
  revalidateConfiguration()
  return { success: true }
}

export async function addCoursesToCenter(
  centerId: string,
  courseIds: string[]
) {
  await requireAdmin()
  const ids = [
    ...new Set(
      courseIds.filter((id) => typeof id === "string" && id.length > 0)
    ),
  ]
  if (!ids.length)
    return { success: false, message: "Seleccione pelo menos um curso." }
  const [center, courses] = await Promise.all([
    prisma.resourceCenter.findFirst({
      where: { id: centerId, active: true },
      select: { id: true },
    }),
    prisma.course.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true },
    }),
  ])
  if (!center || courses.length !== ids.length)
    return { success: false, message: "Curso ou centro não encontrado." }
  await prisma.courseResourceCenter.createMany({
    data: ids.map((courseId) => ({ courseId, resourceCenterId: centerId })),
    skipDuplicates: true,
  })
  revalidateConfiguration()
  revalidatePath(`/admin/configuracoes/centros/${centerId}`)
  for (const id of ids) revalidatePath(`/admin/configuracoes/cursos/${id}`)
  return { success: true }
}
