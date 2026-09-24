"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import {
  parseMaputoDateTime,
  SETTINGS_ID,
} from "@/lib/registration-settings"

export type ConfigurationActionState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[] | undefined>
  revision?: number
}

const courseSchema = z.object({
  name: z.string().trim().min(3, "Introduza o nome completo do curso."),
  shortName: z
    .string()
    .trim()
    .min(2, "A sigla deve ter pelo menos 2 caracteres.")
    .max(12, "A sigla deve ter no máximo 12 caracteres."),
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

async function availableId(model: "course" | "center", source: string) {
  const base = slugify(source) || model
  const exists =
    model === "course"
      ? await prisma.course.findUnique({ where: { id: base }, select: { id: true } })
      : await prisma.resourceCenter.findUnique({ where: { id: base }, select: { id: true } })

  return exists ? `${base}-${Date.now().toString(36)}` : base
}

function revalidateConfiguration() {
  revalidatePath("/admin/configuracoes")
  revalidatePath("/")
  revalidatePath("/inscricao")
}

export async function updateRegistrationPeriod(
  _state: ConfigurationActionState,
  formData: FormData,
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const startValue = textValue(formData, "registrationStart")
  const endValue = textValue(formData, "registrationEnd")
  const start = startValue ? parseMaputoDateTime(startValue) : null
  const end = endValue ? parseMaputoDateTime(endValue) : null
  const fieldErrors: ConfigurationActionState["fieldErrors"] = {}

  if (startValue && !start) fieldErrors.registrationStart = ["Indique uma data de abertura válida."]
  if (endValue && !end) fieldErrors.registrationEnd = ["Indique uma data de encerramento válida."]
  if (start && end && end <= start) {
    fieldErrors.registrationEnd = ["O encerramento deve ser posterior à abertura."]
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors }

  await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { registrationStart: start, registrationEnd: end },
    create: { id: SETTINGS_ID, registrationStart: start, registrationEnd: end },
  })

  revalidateConfiguration()
  return { success: "Prazo das inscrições actualizado.", revision: Date.now() }
}

export async function createCourse(
  _state: ConfigurationActionState,
  formData: FormData,
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const parsed = courseSchema.safeParse({
    name: textValue(formData, "name"),
    shortName: textValue(formData, "shortName").toUpperCase(),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const existing = await prisma.course.findMany({ select: { name: true, shortName: true } })
  const name = parsed.data.name.toLocaleLowerCase("pt")
  const shortName = parsed.data.shortName.toLocaleLowerCase("pt")
  const duplicate = existing.find(
    (course) =>
      course.name.toLocaleLowerCase("pt") === name ||
      course.shortName.toLocaleLowerCase("pt") === shortName,
  )

  if (duplicate) {
    return {
      error: "Já existe um curso com este nome ou esta sigla.",
    }
  }

  await prisma.course.create({
    data: {
      id: await availableId("course", parsed.data.name),
      name: parsed.data.name,
      shortName: parsed.data.shortName,
    },
  })

  revalidateConfiguration()
  return { success: "Curso criado com sucesso.", revision: Date.now() }
}

export async function createResourceCenter(
  _state: ConfigurationActionState,
  formData: FormData,
): Promise<ConfigurationActionState> {
  await requireAdmin()

  const parsed = centerSchema.safeParse({
    name: textValue(formData, "name"),
    location: textValue(formData, "location"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const existing = await prisma.resourceCenter.findMany({ select: { name: true } })
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
  return { success: "Centro de recursos criado com sucesso.", revision: Date.now() }
}

export async function toggleCourse(courseId: string, _formData: FormData) {
  await requireAdmin()
  void _formData
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return

  await prisma.course.update({ where: { id: course.id }, data: { active: !course.active } })
  revalidateConfiguration()
}

export async function toggleResourceCenter(centerId: string, _formData: FormData) {
  await requireAdmin()
  void _formData
  const center = await prisma.resourceCenter.findUnique({ where: { id: centerId } })
  if (!center) return

  await prisma.resourceCenter.update({ where: { id: center.id }, data: { active: !center.active } })
  revalidateConfiguration()
}
