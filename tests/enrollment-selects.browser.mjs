import assert from "node:assert/strict"
// Run with an installed Playwright module path as the first argument.
const { chromium } = await import(process.argv[2] || "playwright")
const browser = await chromium.launch({ channel: "msedge", headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  let posts = 0
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("request", (request) => {
    if (request.method() === "POST") posts++
  })
  await page.goto(process.env.TEST_BASE_URL || "http://localhost:3000")
  assert.equal(
    await page.locator('#nationality svg[data-country="MZ"]').count(),
    1
  )
  await page.locator("#idNumber").fill("123")
  assert.equal(await page.locator("#idNumber-error").count(), 0)
  await page.locator("#phone").focus()
  await page.locator("#idNumber-error").waitFor()
  assert.match(await page.locator("#idNumber-error").innerText(), /12 dígitos/)
  await page.locator("#idNumber").fill("110100123456b")
  await page.locator("#idNumber-error").waitFor({ state: "hidden" })
  assert.equal(await page.locator("#idNumber").inputValue(), "110100123456B")
  await page.locator("#phone").fill("81")
  assert.equal(await page.locator("#phone-error").count(), 0)
  await page.locator("#email").focus()
  await page.locator("#phone-error").waitFor()
  await page.locator("#phone").fill("841234567")
  await page.locator("#phone-error").waitFor({ state: "hidden" })
  assert.equal(await page.locator("#phone").inputValue(), "84 123 4567")
  await page.locator("#email").fill("invalido")
  assert.equal(await page.locator("#email-error").count(), 0)
  await page.locator("#phone").focus()
  await page.locator("#email-error").waitFor()
  await page.locator("#email").fill("")
  await page.locator("#email-error").waitFor({ state: "hidden" })
  await page.locator("#idNumber").fill("")
  await page
    .locator("#idNumber")
    .pressSequentially("abc123xy45678901234bcd", { delay: 30 })
  assert.equal(await page.locator("#idNumber").inputValue(), "123456789012B")
  await page.locator("#phone").fill("")
  await page
    .locator("#phone")
    .pressSequentially("a84b123c456789", { delay: 30 })
  assert.equal(await page.locator("#phone").inputValue(), "84 123 4567")
  await page.locator("#gender").click()
  assert.equal(await page.getByRole("option").count(), 2)
  await page.getByRole("option", { name: "Feminino", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.match(await page.locator("#gender").innerText(), /Feminino/)
  await page.locator("#academicLevel").click()
  await page.getByRole("option", { name: "Ensino médio", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  await page.locator("#academicGroup").click()
  await page.getByRole("option", { name: "B", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  await page.locator("#academicLevel").click()
  await page.getByRole("option", { name: "Ensino médio", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.match(await page.locator("#academicGroup").innerText(), /B/)
  await page.locator("#academicLevel").click()
  await page
    .getByRole("option", { name: "Técnico-profissional", exact: true })
    .click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  await page.locator("#trainingArea").fill("Contabilidade")
  await page.locator("#academicLevel").click()
  await page
    .getByRole("option", { name: "Técnico-profissional", exact: true })
    .click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.equal(
    await page.locator("#trainingArea").inputValue(),
    "Contabilidade"
  )
  await page.locator("#nationality").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  assert.equal(await page.getByRole("option").count(), 249)
  assert.equal(
    await page.getByRole("option").locator("svg[data-country]").count(),
    249
  )
  await page.getByRole("option", { name: "Zimbabué", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.match(await page.locator("#nationality").innerText(), /Zimbabué/)
  await page.locator("#nationality").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  await page.keyboard.press("Home")
  await page.keyboard.type("Portugal", { delay: 50 })
  await page.keyboard.press("Enter")
  assert.match(await page.locator("#nationality").innerText(), /Portugal/)
  assert.equal(
    await page.locator('#nationality svg[data-country="PT"]').count(),
    1
  )
  await page.getByRole("button", { name: /Continuar/ }).click()
  assert.equal(
    await page.locator("#fullName").getAttribute("aria-invalid"),
    "true"
  )
  assert.match(await page.locator("#gender").innerText(), /Feminino/)
  assert.match(await page.locator("#nationality").innerText(), /Portugal/)
  await page.locator("#province").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  assert.equal(await page.getByRole("option").count(), 11)
  await page
    .getByRole("option", { name: "Maputo (Cidade)", exact: true })
    .click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.equal(
    await page.locator("#province").getAttribute("aria-invalid"),
    "false"
  )
  await page.locator("#district").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  assert.equal(await page.getByRole("option").count(), 7)
  await page.getByRole("option", { name: "KaMpfumo", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  await page.locator("#province").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  await page.getByRole("option", { name: "Gaza", exact: true }).click()
  await page.getByRole("listbox").waitFor({ state: "hidden" })
  assert.match(
    await page.locator("#district").innerText(),
    /Selecione o distrito/
  )
  await page.locator("#district").click()
  await page.getByRole("listbox").waitFor({ state: "visible" })
  assert.equal(
    await page.getByRole("option", { name: "KaMpfumo", exact: true }).count(),
    0
  )
  assert.equal(await page.getByRole("option").count(), 14)
  await page.getByRole("option", { name: "Bilene", exact: true }).click()
  for (const [field, value] of Object.entries({
    fullName: "Candidato de Teste",
    birthDate: "2000-01-01",
    idNumber: "110100123456B",
    phone: "841234567",
    school: "Escola de Teste",
  })) {
    await page.locator(`#${field}`).fill(value)
  }
  const latestBirthDate = await page.locator("#birthDate").getAttribute("max")
  assert.match(latestBirthDate, /^\d{4}-\d{2}-\d{2}$/)
  const tooYoungDate = new Date(`${latestBirthDate}T00:00:00.000Z`)
  tooYoungDate.setUTCDate(tooYoungDate.getUTCDate() + 1)
  await page.locator("#birthDate").fill(tooYoungDate.toISOString().slice(0, 10))
  await page.getByRole("button", { name: /Continuar/ }).click()
  assert.match(await page.locator("#birthDate-error").innerText(), /17 anos/)
  await page.locator("#birthDate").fill(latestBirthDate)
  await page.getByRole("button", { name: /Continuar/ }).click()
  for (const field of ["courseId", "resourceCenterId"]) {
    await page.locator(`#${field}`).click()
    await page.getByRole("option").first().click()
    await page.getByRole("listbox").waitFor({ state: "hidden" })
    assert.notEqual(await page.locator(`#${field}`).innerText(), "")
  }
  await page.getByRole("button", { name: /Voltar/ }).click()
  assert.match(await page.locator("#nationality").innerText(), /Portugal/)
  assert.equal(
    await page.locator("#trainingArea").inputValue(),
    "Contabilidade"
  )
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    ),
    false
  )
  assert.equal(posts, 0, "Navigation and validation must not save the form")
  assert.deepEqual(errors, [])
  console.log(
    "PASS: selectors, repeat selection, nationalities, keyboard, validation, preserved values and no intermediate saves"
  )
} finally {
  await browser.close()
}
