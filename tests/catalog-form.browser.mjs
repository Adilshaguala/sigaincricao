import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"

process.loadEnvFile()
const { chromium } = await import(process.argv[2] || "playwright")
const prisma = new PrismaClient()
const browser = await chromium.launch({ channel: "msedge", headless: true })

try {
  const courses = await prisma.course.findMany({
    where: {
      active: true,
      resourceCenters: { some: { resourceCenter: { active: true } } },
    },
    include: {
      resourceCenters: {
        where: { resourceCenter: { active: true } },
        select: { resourceCenterId: true },
      },
    },
  })
  assert.ok(
    courses.length,
    "É necessário pelo menos um curso associado a um centro activo"
  )

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(process.env.TEST_BASE_URL || "http://localhost:3000")
  await page.locator("#fullName").fill("Candidato de Teste")
  await page.locator("#birthDate").fill("2000-01-01")
  await page.locator("#gender").selectOption("Feminino")
  await page.locator("#idNumber").fill("110100123456B")
  await page.locator("#phone").fill("841234567")
  await page.locator("#province").selectOption("Maputo (Cidade)")
  await page.locator("#district").selectOption("KaMpfumo")
  await page.locator("#school").fill("Escola de Teste")
  await page.locator("#academicLevel").selectOption("Ensino médio")
  await page.locator("#academicGroup").selectOption("A")
  await page.getByRole("button", { name: /Continuar/ }).click()

  const courseSelect = page.locator('#courseId[data-slot="native-select"]')
  const centerSelect = page.locator(
    '#resourceCenterId[data-slot="native-select"]'
  )
  await courseSelect.waitFor()
  assert.equal(await centerSelect.isDisabled(), true)
  const courseIds = await courseSelect
    .locator("option")
    .evaluateAll((options) =>
      options
        .map((option) => option.value)
        .filter(Boolean)
        .sort()
    )
  assert.deepEqual(courseIds, courses.map((course) => course.id).sort())

  for (const course of courses) {
    await courseSelect.selectOption(course.id)
    assert.equal(await centerSelect.isDisabled(), false)
    const centerIds = await centerSelect
      .locator("option")
      .evaluateAll((options) =>
        options
          .map((option) => option.value)
          .filter(Boolean)
          .sort()
      )
    assert.deepEqual(
      centerIds,
      course.resourceCenters.map((link) => link.resourceCenterId).sort(),
      `Centros do curso ${course.name}`
    )
    if (course.plan) {
      assert.match(
        await courseSelect.locator(`option[value="${course.id}"]`).innerText(),
        new RegExp(`Plano ${course.plan}`)
      )
    }
    await centerSelect.selectOption(centerIds[0])
    assert.equal(await centerSelect.inputValue(), centerIds[0])
  }
  assert.deepEqual(errors, [])
  console.log(
    "PASS: cursos e centros activos correspondem às associações no Prisma"
  )
} finally {
  await browser.close()
  await prisma.$disconnect()
}
