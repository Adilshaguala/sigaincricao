"use client"

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { unstable_rethrow } from "next/navigation"
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react"

import { submitRegistration, type FormState } from "@/app/actions"
import nationalities from "@/lib/nationalities.json"
import provincesAndDistricts from "@/lib/provincias-distritos.json"
import { formatBi, formatPhone } from "@/lib/enrollment-format"
import {
  registrationSchema,
  registrationDefaults,
  personalFields,
  latestEligibleBirthDate,
  type RegistrationValues,
} from "@/lib/registration-schema"
import {
  EnrollmentInput,
  EnrollmentSelect,
  CourseFields,
} from "@/components/enrollment-fields"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldSeparator,
} from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const provinces = provincesAndDistricts.map((item) => item.provincia)
const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }))
const initialState: FormState = {}

export function RegistrationForm({
  courses,
  centers,
}: {
  courses: { id: string; name: string }[]
  centers: { id: string; name: string; location: string }[]
}) {
  const [step, setStep] = useState("dados")
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: registrationDefaults,
    mode: "onSubmit",
    reValidateMode: "onBlur",
    shouldFocusError: false,
    disabled: pending,
  })
  const level = useWatch({ control: form.control, name: "academicLevel" })
  const province = useWatch({ control: form.control, name: "province" })
  const districts =
    provincesAndDistricts.find((item) => item.provincia === province)
      ?.distritos ?? []

  function focusField(name: keyof RegistrationValues) {
    setStep(personalFields.includes(name) ? "dados" : "curso")
    requestAnimationFrame(() => {
      form.setFocus(name)
      document
        .getElementById(name)
        ?.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }

  function focusErrors(errors: FieldErrors<RegistrationValues>) {
    const name = Object.keys(registrationDefaults).find(
      (key) => errors[key as keyof RegistrationValues]
    ) as keyof RegistrationValues | undefined
    if (name) focusField(name)
  }

  const [serverState, action] = useActionState(
    async (previous: FormState, data: FormData) => {
      try {
        const result = await submitRegistration(previous, data)
        const entries = Object.entries(result.fieldErrors ?? {})
        for (const [name, messages] of entries) {
          if (name in registrationDefaults && messages?.[0]) {
            form.setError(name as keyof RegistrationValues, {
              type: "server",
              message: messages[0],
            })
          }
        }
        const first = entries.find(([, messages]) => messages?.length)?.[0]
        if (first && first in registrationDefaults)
          setStep(
            personalFields.includes(first as keyof RegistrationValues)
              ? "dados"
              : "curso"
          )
        return result
      } catch (error) {
        unstable_rethrow(error)
        return {
          error:
            "Não foi possível confirmar a submissão. Os dados foram mantidos. Verifique a ligação e tente novamente.",
        }
      } finally {
        submitting.current = false
      }
    },
    initialState
  )

  useEffect(() => {
    if (pending) return
    const first = Object.entries(serverState.fieldErrors ?? {}).find(
      ([, messages]) => messages?.length
    )?.[0]
    const frame = requestAnimationFrame(() => {
      if (first && first in registrationDefaults) {
        form.setFocus(first as keyof RegistrationValues)
        document
          .getElementById(first)
          ?.scrollIntoView({ block: "center", behavior: "smooth" })
      } else if (serverState.error) {
        document.getElementById("submission-error")?.focus()
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [serverState, pending, form])

  async function continueToCourse() {
    if (pending || submitting.current) return
    const valid = await form.trigger(personalFields)
    if (valid) {
      setStep("curso")
      requestAnimationFrame(() => form.setFocus("courseId"))
    } else {
      const name = personalFields.find(
        (field) => form.getFieldState(field).invalid
      )
      if (name) focusField(name)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitting.current) return
    if (step === "dados") {
      await continueToCourse()
      return
    }
    await form.handleSubmit((values) => {
      if (submitting.current) return
      submitting.current = true
      const data = new FormData()
      Object.entries(values).forEach(([key, value]) => data.set(key, value))
      startTransition(() => action(data))
    }, focusErrors)()
  }

  const errors = Object.entries(form.formState.errors).filter(
    ([name, error]) =>
      error?.message &&
      (step === "dados"
        ? personalFields.includes(name as keyof RegistrationValues)
        : !personalFields.includes(name as keyof RegistrationValues))
  )
  const unavailable = !courses.length || !centers.length

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={pending}
        className="grid gap-6"
      >
        <FieldDescription>
          Os campos assinalados com * são obrigatórios.
        </FieldDescription>
        <Tabs
          value={step}
          onValueChange={(value) => {
            if (pending) return
            if (value === "dados") setStep("dados")
            else void continueToCourse()
          }}
        >
          <TabsList
            aria-label="Etapas da inscrição"
            activateOnFocus={false}
            className="w-full"
          >
            <TabsTrigger value="dados" type="button" disabled={pending}>
              1. Dados pessoais
            </TabsTrigger>
            <TabsTrigger value="curso" type="button" disabled={pending}>
              2. Curso e centro
            </TabsTrigger>
          </TabsList>

          {serverState.error && !pending && (
            <Alert id="submission-error" tabIndex={-1} variant="destructive">
              <CircleAlert />
              <AlertTitle>Não foi possível submeter a inscrição</AlertTitle>
              <AlertDescription>{serverState.error}</AlertDescription>
            </Alert>
          )}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Verifique os campos assinalados</AlertTitle>
              <AlertDescription>
                Corrija os campos desta etapa para continuar. Os dados
                preenchidos foram mantidos.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="dados">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Identificação pessoal</FieldLegend>
                <FieldDescription>
                  Preencha os dados conforme o seu documento de identificação.
                </FieldDescription>
                <FieldGroup>
                  <EnrollmentInput
                    name="fullName"
                    label="Nome completo"
                    autoComplete="name"
                    placeholder="Ex.: Amélia João Macuácua"
                    minLength={3}
                  />
                  <div className="grid gap-7 sm:grid-cols-2">
                    <EnrollmentInput
                      name="birthDate"
                      label="Data de nascimento"
                      type="date"
                      autoComplete="bday"
                      max={latestEligibleBirthDate()}
                    />
                    <EnrollmentSelect
                      name="gender"
                      label="Género"
                      placeholder="Selecione o género"
                      options={options(["Masculino", "Feminino"])}
                    />
                    <EnrollmentSelect
                      name="nationality"
                      label="Nacionalidade (país)"
                      placeholder="Selecione o país da sua nacionalidade"
                      options={[
                        ...nationalities
                          .filter((item) => item.code === "MZ")
                          .map((item) => ({ ...item, group: "Moçambique" })),
                        ...nationalities
                          .filter((item) => item.code !== "MZ")
                          .map((item) => ({
                            ...item,
                            group: "Outros países e territórios",
                          })),
                      ]}
                    />
                    <EnrollmentInput
                      name="idNumber"
                      label="N.º do BI"
                      placeholder="Ex.: 110100123456B"
                      formatValue={formatBi}
                      pattern="[0-9]{12}[A-Z]"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                    <EnrollmentInput
                      name="phone"
                      label="Telefone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      formatValue={formatPhone}
                      pattern="(\\+258 ?)?8[2-7] ?[0-9]{3} ?[0-9]{4}"
                      placeholder="Numero de telefone"
                    />
                    <EnrollmentInput
                      name="email"
                      label="E-mail (opcional)"
                      required={false}
                      type="email"
                      autoComplete="email"
                      placeholder="nome@exemplo.co.mz"
                    />
                  </div>
                </FieldGroup>
              </FieldSet>
              <FieldSeparator />
              <FieldSet>
                <FieldLegend>Residência</FieldLegend>
                <div className="grid gap-7 sm:grid-cols-2">
                  <EnrollmentSelect
                    name="province"
                    label="Província"
                    placeholder="Selecione a província"
                    options={options(provinces)}
                    onChange={() => {
                      form.setValue("district", "")
                      form.clearErrors("district")
                    }}
                  />
                  <EnrollmentSelect
                    name="district"
                    label="Distrito"
                    placeholder={
                      province
                        ? "Selecione o distrito"
                        : "Primeiro selecione a província"
                    }
                    options={options(districts)}
                  />
                </div>
              </FieldSet>
              <FieldSeparator />
              <FieldSet>
                <FieldLegend>Formação académica</FieldLegend>
                <FieldDescription>
                  Indique a sua formação mais recente.
                </FieldDescription>
                <FieldGroup>
                  <EnrollmentInput
                    name="school"
                    label="Escola ou instituição"
                    placeholder="Nome da escola ou instituição"
                    minLength={2}
                  />
                  <EnrollmentSelect
                    name="academicLevel"
                    label="Nível académico"
                    placeholder="Selecione o nível"
                    options={options([
                      "Ensino médio",
                      "Técnico-profissional",
                      "Ensino superior",
                    ])}
                    onChange={() => {
                      for (const field of [
                        "trainingArea",
                        "academicGroup",
                        "educationCourse",
                      ] as const) {
                        form.setValue(field, "")
                        form.clearErrors(field)
                      }
                    }}
                  />
                  {level === "Ensino médio" && (
                    <EnrollmentSelect
                      name="academicGroup"
                      label="Grupo"
                      placeholder="Selecione o grupo"
                      options={options(["A", "B", "C", "D"])}
                    />
                  )}
                  {level === "Técnico-profissional" && (
                    <EnrollmentInput
                      name="trainingArea"
                      label="Área de formação"
                      placeholder="Ex.: Contabilidade"
                      minLength={2}
                    />
                  )}
                  {level === "Ensino superior" && (
                    <EnrollmentInput
                      name="educationCourse"
                      label="Curso anterior"
                      placeholder="Ex.: Licenciatura em Gestão"
                      minLength={2}
                    />
                  )}
                </FieldGroup>
              </FieldSet>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void continueToCourse()}
                  disabled={pending}
                >
                  Continuar <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="curso">
            <FieldGroup>
              <FieldSet>
                {unavailable && (
                  <Alert>
                    <CircleAlert />
                    <AlertTitle>Opções indisponíveis</AlertTitle>
                    <AlertDescription>
                      Não existem cursos ou centros disponíveis neste momento.
                      Contacte os serviços académicos.
                    </AlertDescription>
                  </Alert>
                )}
                <CourseFields courses={courses} centers={centers} />
              </FieldSet>
              <div className="flex flex-wrap justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setStep("dados")}
                >
                  <ArrowLeft data-icon="inline-start" /> Voltar
                </Button>
                <Button type="submit" disabled={pending || unavailable}>
                  {pending ? (
                    <Spinner />
                  ) : (
                    <ArrowRight data-icon="inline-end" />
                  )}
                  {pending ? "A submeter..." : "Submeter inscrição"}
                </Button>
              </div>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  )
}
