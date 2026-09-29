import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"

process.loadEnvFile()
const { chromium } = await import(process.argv[2] || "playwright")
const browser = await chromium.launch({ channel: "msedge", headless: true })
const prisma = new PrismaClient()
const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000"
const marker = Date.now().toString(36)
const centerName = `Centro de Teste ${marker}`
const courseName = `Curso de Teste ${marker}`
let centerId = null
let courseId = null
let alternateCourseId = null
let previousMainId = null

try {
  assert.ok(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD)
  previousMainId =
    (
      await prisma.resourceCenter.findFirst({
        where: { isMainCampus: true },
        select: { id: true },
      })
    )?.id ?? null
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(`${baseURL}/admin/dashboard`)
  if (new URL(page.url()).pathname === "/admin") {
    await page.locator('[name="username"]').fill(process.env.ADMIN_USERNAME)
    await page.locator('[name="password"]').fill(process.env.ADMIN_PASSWORD)
    await page.getByRole("button", { name: "Entrar na administração" }).click()
    await page.waitForURL(`${baseURL}/admin/dashboard`)
  }

  await page.getByRole("button", { name: "Configurações", exact: true }).click()
  await page
    .getByRole("link", { name: "Centros de recursos", exact: true })
    .click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/centros`)
  await page.getByRole("button", { name: "Adicionar", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("textbox", { name: "Nome" }).fill(centerName)
  await dialog.getByRole("textbox", { name: "Localização" }).fill("Maputo")
  await dialog.getByRole("button", { name: "Submeter" }).click()
  await dialog.waitFor({ state: "hidden" })
  const center = await prisma.resourceCenter.findFirst({
    where: { name: centerName },
  })
  assert.ok(center)
  centerId = center.id
  const otherCenter = await prisma.resourceCenter.findFirst({
    where: { id: { not: centerId }, active: true },
    select: { id: true },
  })
  assert.ok(otherCenter)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  )
  await page
    .getByRole("combobox", { name: "Centro principal" })
    .selectOption(centerId)
  await page
    .getByRole("row")
    .filter({ hasText: centerName })
    .getByText("Principal", { exact: true })
    .waitFor()
  assert.equal(
    (await prisma.resourceCenter.findUnique({ where: { id: centerId } }))
      .isMainCampus,
    true
  )

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole("link", { name: "Cursos", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/cursos`)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  )
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('a[href="/admin/configuracoes/cursos/novo"]').click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/cursos/novo`)
  await page.getByRole("button", { name: "Adicionar curso" }).click()
  await page.getByText("Introduza o nome completo do curso.").waitFor()
  await page.getByRole("textbox", { name: "Nome" }).fill(courseName)
  await page.getByRole("textbox", { name: "Plano" }).fill("B")
  await page.getByRole("spinbutton", { name: "Duração" }).fill("4")
  await page
    .getByRole("combobox", { name: "Grau académico" })
    .selectOption("licenciatura")
  await page
    .getByRole("combobox", { name: "Centros de recursos" })
    .selectOption(centerId)
  await page
    .getByRole("combobox", { name: "Centros de recursos" })
    .selectOption(otherCenter.id)
  await page.getByRole("button", { name: "Adicionar curso" }).click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/cursos`)
  const course = await prisma.course.findFirst({
    where: { name: courseName },
    include: { resourceCenters: true },
  })
  assert.ok(course)
  courseId = course.id
  assert.equal(course.plan, "B")
  assert.equal(course.duration, 4)
  assert.equal(course.academicLevelId, "licenciatura")
  assert.deepEqual(
    course.resourceCenters.map((link) => link.resourceCenterId).sort(),
    [centerId, otherCenter.id].sort()
  )
  await page.getByRole("searchbox", { name: "Pesquisa" }).fill(courseName)
  await page.getByText(courseName, { exact: true }).waitFor()
  await page
    .getByRole("combobox", { name: "Centro de recursos" })
    .selectOption(centerId)
  await page.getByRole("combobox", { name: "Plano" }).selectOption("B")
  await page
    .getByRole("combobox", { name: "Grau académico" })
    .selectOption("licenciatura")
  await page
    .locator(`a[href="/admin/configuracoes/cursos/${courseId}"]`)
    .first()
    .click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/cursos/${courseId}`)
  await page
    .getByRole("heading", { name: "Editar Curso", exact: true })
    .waitFor()
  await page.getByRole("button", { name: "Editar", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Nome" })
    .fill(`${courseName} Actualizado`)
  await page.getByRole("button", { name: "Guardar alterações" }).click()
  await page.getByText("Curso actualizado com sucesso.").waitFor()
  assert.equal(
    await page.getByRole("textbox", { name: "Nome" }).isDisabled(),
    true
  )
  assert.equal(
    (await prisma.course.findUnique({ where: { id: courseId } })).name,
    `${courseName} Actualizado`
  )
  await page.goto(`${baseURL}/admin/configuracoes/centros/${centerId}`)
  await page
    .getByRole("heading", { name: "Centro de recursos", exact: true })
    .waitFor()
  await page.getByRole("button", { name: "Editar", exact: true }).click()
  await page.getByRole("textbox", { name: "Localização" }).fill("Maputo Cidade")
  await page.getByRole("button", { name: "Guardar alterações" }).click()
  await page.getByText("Centro actualizado com sucesso.").waitFor()
  assert.equal(
    await page.getByRole("textbox", { name: "Nome" }).isDisabled(),
    true
  )
  assert.equal(
    (await prisma.resourceCenter.findUnique({ where: { id: centerId } }))
      .location,
    "Maputo Cidade"
  )
  alternateCourseId = `teste-curso-extra-${marker}`
  await prisma.course.create({
    data: {
      id: alternateCourseId,
      name: `Curso Extra ${marker}`,
      shortName: "TESTC",
      plan: "C",
      duration: 3,
      academicLevelId: "licenciatura",
      resourceCenters: { create: { resourceCenterId: otherCenter.id } },
    },
  })
  await page.reload()
  await page.getByRole("button", { name: "Adicionar", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Cursos" })
    .selectOption(alternateCourseId)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Adicionar", exact: true })
    .click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  assert.ok(
    await prisma.courseResourceCenter.findUnique({
      where: {
        courseId_resourceCenterId: {
          courseId: alternateCourseId,
          resourceCenterId: centerId,
        },
      },
    })
  )
  await page.goto(`${baseURL}/admin/configuracoes/cursos`)
  await page
    .getByRole("searchbox", { name: "Pesquisa" })
    .fill(`${courseName} Actualizado`)
  await page
    .getByRole("button", { name: `Eliminar ${courseName} Actualizado` })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmar" })
    .click()
  await page.getByRole("alertdialog").waitFor({ state: "hidden" })
  assert.equal(
    (await prisma.course.findUnique({ where: { id: courseId } })).active,
    false
  )
  const fallbackCenter = await prisma.resourceCenter.findFirst({
    where: { id: { not: centerId }, active: true },
    select: { id: true },
  })
  assert.ok(fallbackCenter)
  await page.goto(`${baseURL}/admin/configuracoes/centros`)
  await page
    .getByRole("combobox", { name: "Centro principal" })
    .selectOption(fallbackCenter.id)
  await page
    .getByRole("searchbox", { name: "Pesquisar centros" })
    .fill(centerName)
  await page.getByRole("button", { name: `Eliminar ${centerName}` }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmar" })
    .click()
  await page.getByRole("alertdialog").waitFor({ state: "hidden" })
  assert.equal(
    (await prisma.resourceCenter.findUnique({ where: { id: centerId } }))
      .active,
    false
  )
  assert.deepEqual(errors, [])
  console.log(
    "PASS: settings sidebar, center and course creation, promotion, filtering, editing and deactivation"
  )
} finally {
  if (courseId) await prisma.course.delete({ where: { id: courseId } })
  if (alternateCourseId)
    await prisma.course.deleteMany({ where: { id: alternateCourseId } })
  if (centerId) await prisma.resourceCenter.delete({ where: { id: centerId } })
  if (centerId) {
    await prisma.resourceCenter.updateMany({
      where: { isMainCampus: true },
      data: { isMainCampus: false },
    })
  }
  if (previousMainId) {
    await prisma.resourceCenter.update({
      where: { id: previousMainId },
      data: { isMainCampus: true },
    })
  }
  await prisma.$disconnect()
  await browser.close()
}
