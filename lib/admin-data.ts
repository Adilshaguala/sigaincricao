import "server-only"

import type { Prisma } from "@prisma/client"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

function studentWhere(filters: {
  query?: string
  courseId?: string
  centerId?: string
  ids?: string[]
}) {
  const query = filters.query?.trim().slice(0, 80) || ""
  const courseId = filters.courseId?.trim() || ""
  const centerId = filters.centerId?.trim() || ""
  const contains = { contains: query, mode: "insensitive" as const }
  const where: Prisma.UserWhereInput = {
    application:
      courseId || centerId
        ? {
            is: {
              ...(courseId ? { courseId } : {}),
              ...(centerId ? { resourceCenterId: centerId } : {}),
            },
          }
        : { isNot: null },
    ...(filters.ids ? { id: { in: filters.ids } } : {}),
    ...(query
      ? {
          OR: [
            { fullName: contains },
            { idNumber: contains },
            { phone: contains },
            { email: contains },
            { application: { is: { course: { is: { name: contains } } } } },
            {
              application: { is: { course: { is: { shortName: contains } } } },
            },
            {
              application: {
                is: { resourceCenter: { is: { name: contains } } },
              },
            },
            {
              application: {
                is: { resourceCenter: { is: { location: contains } } },
              },
            },
          ],
        }
      : {}),
  }

  return { where, query, courseId, centerId }
}

export async function getDashboardData() {
  await requireAdmin()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    totalCandidates,
    totalSubmitted,
    submittedThisMonth,
    activeCenters,
    applications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.application.count(),
    prisma.application.count({ where: { submittedAt: { gte: startOfMonth } } }),
    prisma.resourceCenter.count({ where: { active: true } }),
    prisma.application.findMany({
      include: {
        course: true,
        resourceCenter: true,
        user: {
          select: { id: true, fullName: true, gender: true, idNumber: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ])

  const courseMap = new Map<
    string,
    { name: string; shortName: string; count: number }
  >()
  const centerMap = new Map<
    string,
    { name: string; location: string; count: number }
  >()
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

  const monthFormatter = new Intl.DateTimeFormat("pt-MZ", {
    month: "short",
    timeZone: "Africa/Maputo",
  })
  const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    date.setMonth(date.getMonth() - (11 - index))
    const nextMonth = new Date(date)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    return {
      label: monthFormatter.format(date).replace(".", ""),
      count: applications.filter(
        (application) =>
          application.submittedAt >= date && application.submittedAt < nextMonth
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

export async function getStudents() {
  await requireAdmin()

  const [applications, courses, centers] = await Promise.all([
    prisma.application.findMany({
      select: {
        user: {
          select: {
            id: true,
            fullName: true,
            idNumber: true,
            phone: true,
            email: true,
          },
        },
        course: { select: { id: true, name: true, shortName: true } },
        resourceCenter: { select: { id: true, name: true, location: true } },
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    }),
    prisma.resourceCenter.findMany({
      select: { id: true, name: true, location: true },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    students: applications.map(
      ({ user, course, resourceCenter, submittedAt }) => ({
        ...user,
        course,
        resourceCenter,
        submittedAt: submittedAt.toISOString(),
      })
    ),
    courses,
    centers,
  }
}

export async function getStudentsForExport(filters: {
  query?: string
  courseId?: string
  centerId?: string
  ids?: string[]
}) {
  await requireAdmin()
  const { where, query, courseId, centerId } = studentWhere(filters)

  const [students, course, center] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        application: { include: { course: true, resourceCenter: true } },
      },
      orderBy: { application: { submittedAt: "desc" } },
    }),
    courseId
      ? prisma.course.findUnique({
          where: { id: courseId },
          select: { name: true },
        })
      : null,
    centerId
      ? prisma.resourceCenter.findUnique({
          where: { id: centerId },
          select: { name: true },
        })
      : null,
  ])

  return {
    students,
    query,
    courseName: course?.name ?? "Todos os cursos",
    centerName: center?.name ?? "Todos os centros",
    selectedCount: filters.ids?.length ?? 0,
  }
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

export async function getCourseSettingsData() {
  await requireAdmin()
  const [courses, centers, levels] = await Promise.all([
    prisma.course.findMany({
      where: { active: true },
      include: {
        academicLevel: { select: { id: true, name: true } },
        resourceCenters: {
          include: { resourceCenter: { select: { id: true, name: true } } },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { name: "asc" },
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
  return { courses, centers, levels }
}

export async function getCenterSettingsData() {
  await requireAdmin()
  const centers = await prisma.resourceCenter.findMany({
    where: { active: true },
    include: { _count: { select: { applications: true, courses: true } } },
    orderBy: [{ isMainCampus: "desc" }, { name: "asc" }],
  })
  return { centers }
}
