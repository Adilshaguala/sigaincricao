import { z } from "zod"
import nationalities from "./nationalities.json" with { type: "json" }
import provincesAndDistricts from "./provincias-distritos.json" with { type: "json" }

export function latestEligibleBirthDate(today = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today)
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? ""
  const year = Number(part("year")) - 17
  const month = part("month")
  const lastDay = new Date(Date.UTC(year, Number(month), 0)).getUTCDate()
  const day = Math.min(Number(part("day")), lastDay)
  return `${year}-${month}-${String(day).padStart(2, "0")}`
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^(\+258)?8[2-7]\d{7}$/,
        "Use 9 dígitos: 82, 83, 84, 85, 86 ou 87, seguidos de 7 dígitos (com ou sem +258)."
      )
  )

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Introduza o nome completo."),
    birthDate: z.string().min(1, "Indique a data de nascimento."),
    gender: z
      .string()
      .refine(
        (value) => ["Masculino", "Feminino"].includes(value),
        "Selecione Masculino ou Feminino."
      ),
    nationality: z
      .string()
      .trim()
      .refine(
        (value) => nationalities.some((item) => item.value === value),
        "Selecione o país da sua nacionalidade."
      ),
    idNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^\d{12}[A-Z]$/,
        "O BI deve ter 12 dígitos e uma letra. Ex.: 110100123456B."
      ),
    phone: phoneSchema,
    email: z.union([z.literal(""), z.email("Introduza um e-mail válido.")]),
    province: z
      .string()
      .refine(
        (value) =>
          provincesAndDistricts.some((item) => item.provincia === value),
        "Selecione uma província da lista."
      ),
    district: z.string().trim().min(1, "Selecione o distrito."),
    school: z
      .string()
      .trim()
      .min(2, "Indique a escola ou instituição de ensino."),
    academicLevel: z
      .string()
      .refine(
        (value) =>
          ["Ensino médio", "Técnico-profissional", "Ensino superior"].includes(
            value
          ),
        "Selecione o nível académico."
      ),
    trainingArea: z.string().trim(),
    academicGroup: z.string().trim(),
    educationCourse: z.string().trim(),
  })
  .superRefine((data, context) => {
    if (data.birthDate && !isValidBirthDate(data.birthDate)) {
      context.addIssue({
        code: "custom",
        message: "Introduza uma data de nascimento válida.",
        path: ["birthDate"],
      })
    } else if (data.birthDate > latestEligibleBirthDate()) {
      context.addIssue({
        code: "custom",
        message: "O candidato deve ter pelo menos 17 anos completos.",
        path: ["birthDate"],
      })
    }
    const province = provincesAndDistricts.find(
      (item) => item.provincia === data.province
    )
    if (
      province &&
      data.district &&
      !province.distritos.includes(data.district)
    ) {
      context.addIssue({
        code: "custom",
        message: "Selecione um distrito da província escolhida.",
        path: ["district"],
      })
    }
    if (
      data.academicLevel === "Técnico-profissional" &&
      data.trainingArea.length < 2
    ) {
      context.addIssue({
        code: "custom",
        message: "Indique a sua área de formação técnico-profissional.",
        path: ["trainingArea"],
      })
    }

    if (
      data.academicLevel === "Ensino médio" &&
      !["A", "B", "C", "D"].includes(data.academicGroup)
    ) {
      context.addIssue({
        code: "custom",
        message: "Selecione o grupo do ensino médio.",
        path: ["academicGroup"],
      })
    }

    if (
      data.academicLevel === "Ensino superior" &&
      data.educationCourse.length < 2
    ) {
      context.addIssue({
        code: "custom",
        message: "Indique o curso do ensino superior.",
        path: ["educationCourse"],
      })
    }
  })

export const applicationSchema = z.object({
  courseId: z.string().min(1, "Selecione um curso."),
  resourceCenterId: z.string().min(1, "Selecione um centro de recursos."),
  declaration: z
    .string()
    .refine(
      (value) => value === "on",
      "Confirme que os dados estão correctos."
    ),
})

export const registrationSchema = registerSchema.safeExtend(
  applicationSchema.shape
)
export type RegistrationValues = z.input<typeof registrationSchema>
export const personalFields = Object.keys(
  registerSchema.shape
) as (keyof RegistrationValues)[]
export const registrationDefaults: RegistrationValues = {
  fullName: "",
  birthDate: "",
  gender: "",
  nationality: "Moçambicana",
  idNumber: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  school: "",
  academicLevel: "",
  trainingArea: "",
  academicGroup: "",
  educationCourse: "",
  courseId: "",
  resourceCenterId: "",
  declaration: "",
}
