import "server-only"

import type { Prisma } from "@prisma/client"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

function studentWhere(filters: { query?: string; courseId?: string }) {
  const query = filters.query?.trim().slice(0, 80) || ""
  const courseId = filters.courseId?.trim() || ""
  const where: Prisma.UserWhereInput = {
    application: courseId ? { is: { courseId } } : { isNot: null },
    ...(query
      ? {
          OR: [
            { fullName: { contains: query } },
            { idNumber: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  }

  return { where, query, courseId }
}

export async function getDashboardData() {
  await requireAdmin()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [totalCandidates, totalSubmitted, submittedThisMonth, activeCenters, applications] =
    await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.application.count({ where: { submittedAt: { gte: startOfMonth } } }),
      prisma.resourceCenter.count({ where: { active: true } }),
      prisma.application.findMany({
        include: {
          course: true,
          resourceCenter: true,
          user: { select: { id: true, fullName: true, gender: true, idNumber: true } },
        },
        orderBy: { submittedAt: "desc" },
      }),
    ])

  const courseMap = new Map<string, { name: string; shortName: string; count: number }>()
  const centerMap = new Map<string, { name: string; location: string; count: number }>()
  const genderMap = new Map<string, number>()

  for (const application of applications) {
    const course = courseMap.get(application.courseId)
    courseMap.set(application.courseId, {
      name: application.course.name,
      shortName: application.course.shortName,
      count: (course?.count ?? 0) + 1,
    })

    const center = centerMap.get(application.resourceCenterId)
    centerMap.set(application.resourceCenterId, {
      name: application.resourceCenter.name,
      location: application.resourceCenter.location,
      count: (center?.count ?? 0) + 1,
    })

    const gender = application.user.gender || "Não indicado"
    genderMap.set(gender, (genderMap.get(gender) ?? 0) + 1)
  }

  const monthFormatter = new Intl.DateTimeFormat("pt-MZ", { month: "short" })
  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    date.setMonth(date.getMonth() - (5 - index))
    const nextMonth = new Date(date)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    return {
      label: monthFormatter.format(date).replace(".", ""),
      count: applications.filter(
        (application) =>
          application.submittedAt >= date && application.submittedAt < nextMonth,
      ).length,
    }
  })

  return {
    totalCandidates,
    totalSubmitted,
    pending: totalCandidates - totalSubmitted,
    submittedThisMonth,
    activeCenters,
    courseCounts: [...courseMap.values()].sort((a, b) => b.count - a.count),
    centerCounts: [...centerMap.values()].sort((a, b) => b.count - a.count),
    genderCounts: [...genderMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    monthlyTrend,
    recentApplications: applications.slice(0, 5),
  }
}

export async function getStudents(filters: { query?: string; courseId?: string }) {
  await requireAdmin()

  const { where, query, courseId } = studentWhere(filters)

  const [students, total, courses] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        application: { include: { course: true, resourceCenter: true } },
      },
      orderBy: { application: { submittedAt: "desc" } },
      take: 100,
    }),
    prisma.user.count({ where }),
    prisma.course.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ])

  return { students, total, courses, query, courseId }
}

export async function getStudentsForExport(filters: { query?: string; courseId?: string }) {
  await requireAdmin()
  const { where, query, courseId } = studentWhere(filters)

  const [students, course] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        application: { include: { course: true, resourceCenter: true } },
      },
      orderBy: { application: { submittedAt: "desc" } },
    }),
    courseId
      ? prisma.course.findUnique({ where: { id: courseId }, select: { name: true } })
      : null,
  ])

  return { students, query, courseName: course?.name ?? "Todos os cursos" }
}

export async function getStudentDetails(id: string) {
  await requireAdmin()

  return prisma.user.findFirst({
    where: { id, application: { isNot: null } },
    include: {
      application: { include: { course: true, resourceCenter: true } },
    },
  })
}

export async function getConfigurationData() {
  await requireAdmin()

  const [settings, courses, centers] = await Promise.all([
    prisma.systemSettings.findUnique({ where: { id: "default" } }),
    prisma.course.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.resourceCenter.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  return { settings, courses, centers }
}
