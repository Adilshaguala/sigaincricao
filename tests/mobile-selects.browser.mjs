import assert from "node:assert/strict"

// Run with Playwright installed, or pass the module URL as the first argument.
const { chromium } = await import(process.argv[2] || "playwright")
const browser = await chromium.launch({ channel: "msedge", headless: true })

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const errors = []
  let posts = 0
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("request", (request) => {
    if (request.method() === "POST") posts++
  })

  await page.goto(process.env.TEST_BASE_URL || "http://localhost:3000")
  await page.locator('#gender[data-slot="native-select"]').waitFor()

  const select = async (name, value) => {
    const control = page.locator(`#${name}[data-slot="native-select"]`)
    await control.tap()
    await control.selectOption(value)
    assert.equal(await control.inputValue(), value)
  }

  await select("gender", "Feminino")
  const nationality = page.locator('#nationality[data-slot="native-select"]')
  assert.equal(await nationality.locator("option").count(), 250)
  assert.match(
    await nationality.locator('option[value="Moçambicana"]').innerText(),
    /🇲🇿/
  )
  await select("nationality", "Portugal")

  const district = page.locator('#district[data-slot="native-select"]')
  assert.equal(await district.isDisabled(), true)
  await select("province", "Maputo (Cidade)")
  assert.equal(await district.isDisabled(), false)
  assert.equal(await district.locator("option").count(), 8)
  await select("district", "KaMpfumo")
  await select("province", "Gaza")
  assert.equal(await district.inputValue(), "")
  assert.equal(await district.locator('option[value="KaMpfumo"]').count(), 0)
  await select("district", "Bilene")

  await select("academicLevel", "Ensino médio")
  await select("academicGroup", "B")
  await select("academicLevel", "Ensino médio")
  assert.equal(await page.locator("#academicGroup").inputValue(), "B")

  for (const [name, value] of Object.entries({
    fullName: "Candidato de Teste",
    birthDate: "2000-01-01",
    idNumber: "110100123456B",
    phone: "841234567",
    school: "Escola de Teste",
  })) {
    await page.locator(`#${name}`).fill(value)
  }
  await page.getByRole("button", { name: /Continuar/ }).tap()
  await page.locator('#courseId[data-slot="native-select"]').waitFor()
  const course = page.locator('#courseId[data-slot="native-select"]')
  const center = page.locator('#resourceCenterId[data-slot="native-select"]')
  await select(
    "courseId",
    await course.locator("option:not([disabled])").first().getAttribute("value")
  )
  await select(
    "resourceCenterId",
    await center.locator("option:not([disabled])").first().getAttribute("value")
  )
  await page.getByRole("button", { name: /Voltar/ }).tap()
  assert.equal(await page.locator("#province").inputValue(), "Gaza")
  assert.equal(await page.locator("#district").inputValue(), "Bilene")
  assert.equal(posts, 0)
  assert.deepEqual(errors, [])
  console.log(
    "PASS: touch controls, nationality, dependent districts, course selection and preserved values"
  )
} finally {
  await browser.close()
}
