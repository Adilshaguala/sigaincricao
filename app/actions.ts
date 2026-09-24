"use server"

import { redirect } from "next/navigation"
import { registerSchema, applicationSchema } from "@/lib/registration-schema"

import {
  clearApplicationAccess,
  createApplicationAccess,
  requireApplicant,
} from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRegistrationPeriod } from "@/lib/registration-settings"

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  step?: 1 | 2
  submissionId?: number
}

function textValue(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

function personalDataValues(formData: FormData) {
  return {
    fullName: textValue(formData, "fullName"),
    birthDate: textValue(formData, "birthDate"),
    gender: textValue(formData, "gender"),
    nationality: textValue(formData, "nationality"),
    idNumber: textValue(formData, "idNumber"),
    phone: textValue(formData, "phone"),
    email: textValue(formData, "email"),
    province: textValue(formData, "province"),
    district: textValue(formData, "district"),
    school: textValue(formData, "school"),
    academicLevel: textValue(formData, "academicLevel"),
    trainingArea: textValue(formData, "trainingArea"),
    academicGroup: textValue(formData, "academicGroup"),
    educationCourse: textValue(formData, "educationCourse"),
  }
}

function applicationValues(formData: FormData) {
  return {
    courseId: textValue(formData, "courseId"),
    resourceCenterId: textValue(formData, "resourceCenterId"),
    declaration: textValue(formData, "declaration"),
  }
}

export async function submitRegistration(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const period = await getRegistrationPeriod()
  if (period.state !== "open") {
    return { error: period.message, step: 2, submissionId: Date.now() }
  }

  const personal = registerSchema.safeParse(personalDataValues(formData))
  const application = applicationSchema.safeParse(applicationValues(formData))

  if (!personal.success || !application.success) {
    return {
      fieldErrors: {
        ...(personal.success ? {} : personal.error.flatten().fieldErrors),
        ...(application.success ? {} : application.error.flatten().fieldErrors),
      },
      step: personal.success ? 2 : 1,
      submissionId: Date.now(),
    }
  }

  const data = personal.data
  const existing = await prisma.user.findUnique({
    where: { idNumber: data.idNumber },
    select: { idNumber: true },
  })

  if (existing) {
    return {
      fieldErrors: {
        idNumber: ["Este documento de identificação já está registado."],
      },
      step: 1,
      submissionId: Date.now(),
    }
  }

  const [course, center] = await Promise.all([
    prisma.course.findFirst({
      where: { id: application.data.courseId, active: true },
    }),
    prisma.resourceCenter.findFirst({
      where: { id: application.data.resourceCenterId, active: true },
    }),
  ])

  if (!course || !center) {
    return {
      error: "O curso ou centro selecionado já não está disponível.",
      step: 2,
      submissionId: Date.now(),
    }
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
      gender: data.gender,
      nationality: data.nationality,
      idNumber: data.idNumber,
      phone: data.phone,
      email: data.email || null,
      province: data.province,
      district: data.district,
      school: data.school,
      academicLevel: data.academicLevel,
      trainingArea:
        data.academicLevel === "Técnico-profissional"
          ? data.trainingArea
          : null,
      academicGroup:
        data.academicLevel === "Ensino médio" ? data.academicGroup : null,
      educationCourse:
        data.academicLevel === "Ensino superior" ? data.educationCourse : null,
      application: {
        create: {
          courseId: course.id,
          resourceCenterId: center.id,
        },
      },
    },
  })

  await createApplicationAccess(user.id)
  redirect("/?step=curso&submitted=1")
}

export async function submitApplication(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireApplicant()

  if (user.application) {
    return { error: "Esta inscrição já foi submetida e não pode ser alterada." }
  }

  const period = await getRegistrationPeriod()
  if (period.state !== "open") return { error: period.message }

  const parsed = applicationSchema.safeParse(applicationValues(formData))
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [course, center] = await Promise.all([
    prisma.course.findFirst({
      where: { id: parsed.data.courseId, active: true },
    }),
    prisma.resourceCenter.findFirst({
      where: { id: parsed.data.resourceCenterId, active: true },
    }),
  ])

  if (!course || !center) {
    return { error: "O curso ou centro selecionado já não está disponível." }
  }

  await prisma.application.create({
    data: {
      userId: user.id,
      courseId: course.id,
      resourceCenterId: center.id,
    },
  })

  redirect("/?step=curso&submitted=1")
}

export async function startNewRegistration() {
  await clearApplicationAccess()
  redirect("/")
}
