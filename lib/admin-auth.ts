import "server-only"

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

const scryptAsync = promisify(scrypt)
const COOKIE_NAME = "siga_admin_session"
const SESSION_DURATION = 1000 * 60 * 60 * 8

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":")
  if (!salt || !key) return false

  const storedKey = Buffer.from(key, "hex")
  const derivedKey = (await scryptAsync(password, salt, storedKey.length)) as Buffer
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

export async function ensureDefaultAdministrator() {
  const username = process.env.ADMIN_USERNAME?.trim()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || "Administrador"

  if (!username || !password) return false

  const existing = await prisma.administrator.findUnique({ where: { username } })
  if (!existing) {
    await prisma.administrator.create({
      data: { username, name, passwordHash: await hashPassword(password) },
    })
  }

  return true
}

export async function createAdminSession(administratorId: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.adminSession.create({
    data: { tokenHash: hashToken(token), administratorId, expiresAt },
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: expiresAt,
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } })
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: new Date(0),
  })
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { administrator: true },
  })

  if (!session || session.expiresAt <= new Date()) return null
  return session.administrator
}

export async function requireAdmin() {
  const administrator = await getCurrentAdmin()
  if (!administrator) redirect("/admin")
  return administrator
}
