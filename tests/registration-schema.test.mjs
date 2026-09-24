import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { formatBi, formatPhone } from "../lib/enrollment-format.ts"
import { hasFlag } from "country-flag-icons"
import nationalities from "../lib/nationalities.json" with { type: "json" }
import provincesAndDistricts from "../lib/provincias-distritos.json" with { type: "json" }
import {
  registrationSchema,
  registrationDefaults,
  latestEligibleBirthDate,
} from "../lib/registration-schema.ts"

const candidate = {
  ...registrationDefaults,
  fullName: "Candidato de Teste",
  birthDate: "2000-01-01",
  gender: "Masculino",
  idNumber: "110100123456B",
  phone: "+258 84 000 0000",
  province: "Maputo (Cidade)",
  district: "KaMpfumo",
  school: "Escola de Teste",
  academicLevel: "Ensino médio",
  academicGroup: "A",
  courseId: "curso-teste",
  resourceCenterId: "centro-teste",
  declaration: "on",
}

test("validates the full registration and normalizes the phone", () => {
  const result = registrationSchema.parse(candidate)
  assert.equal(result.phone, "+258840000000")
})

test("requires 17 completed years in Mozambique, including the birthday", () => {
  const cutoff = latestEligibleBirthDate()
  const nextDay = new Date(`${cutoff}T00:00:00.000Z`)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  assert.equal(
    registrationSchema.safeParse({ ...candidate, birthDate: cutoff }).success,
    true
  )
  const tooYoung = registrationSchema.safeParse({
    ...candidate,
    birthDate: nextDay.toISOString().slice(0, 10),
  })
  assert.equal(tooYoung.success, false)
  assert.deepEqual(tooYoung.error.flatten().fieldErrors.birthDate, [
    "O candidato deve ter pelo menos 17 anos completos.",
  ])
  assert.equal(
    latestEligibleBirthDate(new Date("2028-02-29T12:00:00.000Z")),
    "2011-02-28"
  )
  for (const invalid of ["2009-02-29", "not-a-date"]) {
    const result = registrationSchema.safeParse({
      ...candidate,
      birthDate: invalid,
    })
    assert.equal(result.success, false)
    assert.deepEqual(result.error.flatten().fieldErrors.birthDate, [
      "Introduza uma data de nascimento válida.",
    ])
  }
})

test("province and district options match every row in the CSV", () => {
  const rows = readFileSync(
    new URL("../provincias_distritos_mocambique.csv", import.meta.url),
    "utf8"
  )
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","))
  const csvPairs = rows
    .map(([province, , district]) => `${province}|${district}`)
    .sort()
  const optionPairs = provincesAndDistricts
    .flatMap((item) =>
      item.distritos.map((district) => `${item.provincia}|${district}`)
    )
    .sort()
  assert.equal(provincesAndDistricts.length, 11)
  assert.equal(optionPairs.length, 161)
  assert.deepEqual(optionPairs, csvPairs)
  for (const item of provincesAndDistricts) {
    assert.equal(
      registrationSchema.safeParse({
        ...candidate,
        province: item.provincia,
        district: item.distritos[0],
      }).success,
      true
    )
  }
  const invalid = registrationSchema.safeParse({
    ...candidate,
    province: "Gaza",
    district: "KaMpfumo",
  })
  assert.equal(invalid.success, false)
  assert.deepEqual(invalid.error.flatten().fieldErrors.district, [
    "Selecione um distrito da província escolhida.",
  ])
})

test("nationalities cover all 249 ISO countries and territories without duplicates", () => {
  assert.equal(nationalities.length, 249)
  assert.equal(new Set(nationalities.map((item) => item.code)).size, 249)
  assert.equal(new Set(nationalities.map((item) => item.value)).size, 249)
  for (const nationality of nationalities) {
    assert.equal(hasFlag(nationality.code), true, nationality.code)
    assert.equal(
      registrationSchema.safeParse({
        ...candidate,
        nationality: nationality.value,
      }).success,
      true
    )
  }
  for (const nationality of ["", "invalid-country"]) {
    const result = registrationSchema.safeParse({ ...candidate, nationality })
    assert.equal(result.success, false)
    assert.deepEqual(result.error.flatten().fieldErrors.nationality, [
      "Selecione o país da sua nacionalidade.",
    ])
  }
})

test("empty fields produce errors for both steps", () => {
  const result = registrationSchema.safeParse(registrationDefaults)
  assert.equal(result.success, false)
  const fields = result.error.flatten().fieldErrors
  for (const name of [
    "fullName",
    "phone",
    "academicLevel",
    "courseId",
    "resourceCenterId",
    "declaration",
  ]) {
    assert.ok(fields[name]?.length, name)
  }
})

for (const [level, field, value] of [
  ["Ensino médio", "academicGroup", "B"],
  ["Técnico-profissional", "trainingArea", "Contabilidade"],
  ["Ensino superior", "educationCourse", "Licenciatura em Gestão"],
]) {
  test(`requires only the field relevant to ${level}`, () => {
    const values = {
      ...candidate,
      academicLevel: level,
      academicGroup: "",
      trainingArea: "",
      educationCourse: "",
    }
    const invalid = registrationSchema.safeParse(values)
    assert.equal(invalid.success, false)
    assert.ok(invalid.error.flatten().fieldErrors[field])
    assert.equal(
      registrationSchema.safeParse({ ...values, [field]: value }).success,
      true
    )
  })
}

test("rejects invalid group, phone, email, future birthdate and unconfirmed declaration", () => {
  for (const [field, value] of [
    ["academicGroup", "E"],
    ["phone", "123"],
    ["email", "invalid"],
    ["birthDate", "2999-01-01"],
    ["declaration", ""],
    ["gender", "Outro"],
    ["idNumber", "12345"],
    ["idNumber", "1101001234567B"],
    ["idNumber", "110100123456BB"],
  ]) {
    const result = registrationSchema.safeParse({
      ...candidate,
      [field]: value,
    })
    assert.equal(result.success, false)
    assert.ok(result.error.flatten().fieldErrors[field])
  }
})

test("normalizes the BI letter and validates both allowed genders", () => {
  for (const gender of ["Masculino", "Feminino"]) {
    const result = registrationSchema.parse({
      ...candidate,
      gender,
      idNumber: "110100123456b",
    })
    assert.equal(result.idNumber, "110100123456B")
  }
})

test("masks BI positions and limits the phone to nine digits", () => {
  assert.equal(formatBi("110100123456b"), "110100123456B")
  assert.equal(formatPhone("841234567"), "84 123 4567")
  assert.equal(formatPhone("+258841234567"), "84 123 4567")
  assert.equal(formatPhone("84a123b456789"), "84 123 4567")
  assert.equal(formatBi("a123b"), "123")
  assert.equal(formatBi("12345678901234bc"), "123456789012B")
  assert.equal(formatBi("12345678901b2"), "123456789012")
  assert.equal(formatBi(""), "")
  assert.equal(formatPhone(""), "")
})
