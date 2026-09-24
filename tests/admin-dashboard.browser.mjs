import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"

process.loadEnvFile()
const { chromium } = await import(process.argv[2] || "playwright")
const browser = await chromium.launch({ channel: "msedge", headless: true })
const prisma = new PrismaClient()
const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000"

try {
  assert.ok(
    process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD,
    "Configure admin credentials for the browser test"
  )
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(`${baseURL}/admin/dashboard`)
  await page.waitForURL(`${baseURL}/admin`)
  await page.locator('[name="username"]').fill(process.env.ADMIN_USERNAME)
  await page.locator('[name="password"]').fill(process.env.ADMIN_PASSWORD)
  await page.getByRole("button", { name: "Entrar na administração" }).click()
  await page.waitForURL(`${baseURL}/admin/dashboard`)
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor()
  const total = await prisma.application.count()
  const summary = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("Inscrições submetidas", { exact: true }) })
  assert.equal(
    await summary.locator('[data-slot="card-title"]').innerText(),
    total.toLocaleString("pt-MZ")
  )
  await page.getByLabel("Período do gráfico").selectOption("3")
  await page.getByRole("tab", { name: "Centros", exact: true }).click()
  await page.getByRole("tab", { name: "Género", exact: true }).click()
  assert.equal(
    await page
      .locator('header a[href="/admin/estudantes/exportar"]')
      .getAttribute("download"),
    ""
  )
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('header a[href="/admin/estudantes/exportar"]').click(),
  ])
  assert.match(download.suggestedFilename(), /\.xlsx$/)
  assert.equal(
    await page
      .getByRole("link", { name: "Dashboard", exact: true })
      .getAttribute("aria-current"),
    "page"
  )
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await page.getByRole("link", { name: "Estudantes", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/estudantes`)
  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/dashboard`)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  const menu = page.getByRole("dialog")
  await menu.waitFor({ state: "visible" })
  await menu.getByRole("link", { name: "Configurações", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/configuracoes`)
  await menu.waitFor({ state: "hidden" })
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await menu.getByRole("link", { name: "Dashboard", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/dashboard`)
  await menu.waitFor({ state: "hidden" })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  )
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await menu.getByRole("button", { name: "Menu do administrador" }).click()
  await page.getByRole("menuitem", { name: "Terminar sessão" }).click()
  await page.waitForURL(`${baseURL}/admin`)
  assert.deepEqual(errors, [])
  console.log(
    "PASS: protected dashboard, real counts, charts, navigation, mobile menu, export link and logout"
  )
} finally {
  await prisma.$disconnect()
  await browser.close()
}
