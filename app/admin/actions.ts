"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import {
  clearAdminSession,
  createAdminSession,
  ensureDefaultAdministrator,
  verifyPassword,
} from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export type AdminLoginState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

const loginSchema = z.object({
  username: z.string().trim().min(1, "Introduza o nome de utilizador."),
  password: z.string().min(1, "Introduza a senha."),
})

function textValue(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

export async function loginAdmin(
  _state: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({
    username: textValue(formData, "username"),
    password: textValue(formData, "password"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const configured = await ensureDefaultAdministrator()
  if (!configured) {
    return { error: "As credenciais administrativas ainda não foram configuradas." }
  }

  const administrator = await prisma.administrator.findUnique({
    where: { username: parsed.data.username },
  })

  if (
    !administrator ||
    !(await verifyPassword(parsed.data.password, administrator.passwordHash))
  ) {
    return { error: "Nome de utilizador ou senha incorrectos." }
  }

  await createAdminSession(administrator.id)
  redirect("/admin/dashboard")
}

export async function logoutAdmin() {
  await clearAdminSession()
  redirect("/admin")
}
