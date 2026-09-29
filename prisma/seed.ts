import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/password"

function readAccount(prefix: "ADMIN" | "ROOT", defaultName: string) {
  const password = process.env[`${prefix}_PASSWORD`]
  if (!password?.trim()) {
    throw new Error(
      `Defina ${prefix}_PASSWORD no ficheiro .env antes de executar o seeder.`
    )
  }

  return {
    username: process.env[`${prefix}_USERNAME`]?.trim() || prefix.toLowerCase(),
    name: process.env[`${prefix}_NAME`]?.trim() || defaultName,
    password,
  }
}

async function main() {
  const accounts = [
    readAccount("ADMIN", "Administrador"),
    readAccount("ROOT", "Root"),
  ]

  if (
    accounts[0].username.toLowerCase() === accounts[1].username.toLowerCase()
  ) {
    throw new Error("ADMIN_USERNAME e ROOT_USERNAME devem ser diferentes.")
  }

  const prisma = new PrismaClient()
  try {
    const records = await Promise.all(
      accounts.map(async ({ username, name, password }) => ({
        username,
        name,
        passwordHash: await hashPassword(password),
      }))
    )

    await prisma.$transaction([
      ...records.map((record) =>
        prisma.administrator.upsert({
          where: { username: record.username },
          update: {},
          create: record,
        })
      ),
      ...[
        { id: "licenciatura", name: "Licenciatura" },
        { id: "mestrado", name: "Mestrado" },
        { id: "doutoramento", name: "Doutoramento" },
        { id: "tecnico-profissional", name: "Técnico Profissional" },
      ].map((level) =>
        prisma.academicLevel.upsert({
          where: { id: level.id },
          update: {},
          create: level,
        })
      ),
    ])

    console.log(
      `Contas ${accounts.map((account) => account.username).join(" e ")} garantidas; senhas existentes preservadas.`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
