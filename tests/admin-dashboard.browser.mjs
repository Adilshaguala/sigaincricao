import assert from "node:assert/strict"
import ExcelJS from "exceljs"
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
  await page.getByRole("heading", { name: "Área administrativa" }).waitFor()
  assert.equal(await page.locator('[data-slot="card"]').count(), 1)
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
  await page.getByRole("heading", { name: "Estudantes inscritos" }).waitFor()
  await page
    .getByRole("searchbox", { name: "Pesquisar estudantes" })
    .fill("pesquisa-sem-resultados-xyz")
  await page.getByText("Nenhum estudante encontrado").waitFor()
  await page
    .getByRole("table", { name: "Tabela de estudantes inscritos" })
    .getByRole("button", { name: "Limpar filtros" })
    .click()
  assert.equal(
    await page
      .getByRole("searchbox", { name: "Pesquisar estudantes" })
      .inputValue(),
    ""
  )
  const application = await prisma.application.findFirst({
    include: { user: true, course: true, resourceCenter: true },
  })
  if (application) {
    await page
      .getByRole("searchbox", { name: "Pesquisar estudantes" })
      .fill(application.user.fullName)
    await page.getByText(application.user.fullName, { exact: true }).waitFor()
    await page.getByRole("searchbox", { name: "Pesquisar estudantes" }).fill("")
    await page
      .getByRole("combobox", { name: "Filtrar por curso" })
      .selectOption(application.courseId)
    await page.getByText(application.user.fullName, { exact: true }).waitFor()
    await page
      .getByRole("combobox", { name: "Filtrar por centro" })
      .selectOption(application.resourceCenterId)
    await page.getByText(application.user.fullName, { exact: true }).waitFor()
    const filteredExport = page.locator(
      'a[href*="/admin/estudantes/exportar?courseId="]'
    )
    assert.match(await filteredExport.getAttribute("href"), /centerId=/)
    const [filteredDownload] = await Promise.all([
      page.waitForEvent("download"),
      filteredExport.click(),
    ])
    const filteredWorkbook = new ExcelJS.Workbook()
    await filteredWorkbook.xlsx.readFile(await filteredDownload.path())
    assert.equal(
      filteredWorkbook.getWorksheet("Estudantes inscritos").rowCount - 1,
      await prisma.application.count({
        where: {
          courseId: application.courseId,
          resourceCenterId: application.resourceCenterId,
        },
      })
    )
    await page
      .getByRole("checkbox", {
        name: `Seleccionar ${application.user.fullName}`,
      })
      .check()
    const selectedExport = page.getByRole("button", {
      name: "Exportar 1 seleccionado",
    })
    assert.equal(
      await page
        .locator('form[action="/admin/estudantes/exportar"] input[name="id"]')
        .inputValue(),
      application.userId
    )
    const [selectedDownload] = await Promise.all([
      page.waitForEvent("download"),
      selectedExport.click(),
    ])
    assert.match(selectedDownload.suggestedFilename(), /\.xlsx$/)
    const selectedWorkbook = new ExcelJS.Workbook()
    await selectedWorkbook.xlsx.readFile(await selectedDownload.path())
    const selectedWorksheet = selectedWorkbook.getWorksheet(
      "Estudantes inscritos"
    )
    assert.equal(selectedWorksheet.rowCount, 2)
    assert.equal(
      selectedWorksheet.getRow(2).getCell(2).value,
      application.user.fullName
    )
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      false
    )
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole("button", { name: "Actualizar lista" }).click()
    await page.goto(`${baseURL}/admin/estudantes/${application.userId}`)
    await page
      .getByRole("heading", { name: application.user.fullName })
      .waitFor()
    await page.getByText("Inscrição académica").waitFor()
  }
  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/dashboard`)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  const menu = page.getByRole("dialog")
  await menu.waitFor({ state: "visible" })
  await menu.getByRole("button", { name: "Configurações", exact: true }).click()
  await menu.getByRole("link", { name: "Prazo das inscrições" }).click()
  await page.waitForURL(`${baseURL}/admin/configuracoes`)
  await menu.waitFor({ state: "hidden" })
  await page
    .getByRole("heading", { name: "Configurações", exact: true })
    .waitFor()
  await page.getByRole("heading", { name: "Prazo das inscrições" }).waitFor()
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await menu.getByRole("link", { name: "Cursos", exact: true }).click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/cursos`)
  await page.getByRole("heading", { name: "Cursos", exact: true }).waitFor()
  await page.getByRole("button", { name: "Abrir ou fechar menu" }).click()
  await menu
    .getByRole("link", { name: "Centros de recursos", exact: true })
    .click()
  await page.waitForURL(`${baseURL}/admin/configuracoes/centros`)
  await page
    .getByRole("heading", { name: "Centro de recursos", exact: true })
    .waitFor()
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  )
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
    "PASS: protected dashboard, students, details, configuration, mobile menu, export and logout"
  )
} finally {
  await prisma.$disconnect()
  await browser.close()
}
