import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

const COOKIE_NAME = "siga_application"
const ACCESS_DURATION = 1000 * 60 * 60 * 24 * 30

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createApplicationAccess(userId: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + ACCESS_DURATION)

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearApplicationAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }

  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentApplicant() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          application: { include: { course: true, resourceCenter: true } },
        },
      },
    },
  })

  if (!session || session.expiresAt <= new Date()) return null
  return session.user
}

export async function requireApplicant() {
  const user = await getCurrentApplicant()
  if (!user) redirect("/")
  return user
}
