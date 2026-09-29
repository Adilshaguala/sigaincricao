import Link from "next/link"
import { CheckCircle2, Clock3, LockKeyhole } from "lucide-react"

import { ApplicationForm } from "@/components/application-form"
import { AuthShell } from "@/components/auth-shell"
import { CloseApplicationButton } from "@/components/close-application-button"
import { RegistrationForm } from "@/components/registration-form"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getCurrentApplicant } from "@/lib/auth"
import { getCatalog } from "@/lib/catalog"
import { getRegistrationPeriod } from "@/lib/registration-settings"

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <Field className={wide ? "sm:col-span-2" : undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Input aria-label={label} value={value} readOnly />
    </Field>
  )
}

function PeriodNotice({ message }: { message: string }) {
  return (
    <Alert>
      <Clock3 />
      <AlertTitle>Prazo de candidaturas</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export default async function ApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; submitted?: string }>
}) {
  const params = await searchParams
  const [user, period] = await Promise.all([
    getCurrentApplicant(),
    getRegistrationPeriod(),
  ])

  if (!user) {
    if (period.state !== "open") {
      return (
        <AuthShell
          title={
            period.state === "upcoming"
              ? "As candidaturas ainda não abriram"
              : "As candidaturas estão encerradas"
          }
          description="O formulário ficará disponível durante o período definido pelos serviços académicos."
        >
          <PeriodNotice message={period.message} />
        </AuthShell>
      )
    }
    const { courses, centers } = await getCatalog()
    return (
      <AuthShell
        title="Formulário de candidatura"
        description="Preencha o formulário para efectuar a sua candidatura"
      >
        <RegistrationForm courses={courses} centers={centers} />
      </AuthShell>
    )
  }

  const { courses, centers } = await getCatalog()
  const submitted = Boolean(user.application)
  const activeStep = params.step === "dados" ? "dados" : "curso"
  const date = new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(user.birthDate)

  return (
    <AuthShell
      title="A sua candidatura"
      description="Consulte os dados da sua candidatura."
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant={submitted ? "default" : "secondary"}>
            {submitted ? <CheckCircle2 /> : <Clock3 />}
            {submitted ? "Candidatura submetida" : "A aguardar submissão"}
          </Badge>
        </div>

        {params.submitted === "1" && submitted && (
          <Alert role="status">
            <CheckCircle2 />
            <AlertTitle>Candidatura submetida com sucesso</AlertTitle>
            <AlertDescription>
              Os seus dados estão agora bloqueados para edição.
            </AlertDescription>
          </Alert>
        )}

        <nav aria-label="Dados da candidatura" className="flex flex-wrap gap-2">
          <Button
            variant={activeStep === "dados" ? "default" : "outline"}
            render={<Link href="/inscricao?step=dados" />}
            nativeButton={false}
            aria-current={activeStep === "dados" ? "page" : undefined}
          >
            Dados pessoais
          </Button>
          <Button
            variant={activeStep === "curso" ? "default" : "outline"}
            render={<Link href="/inscricao?step=curso" />}
            nativeButton={false}
            aria-current={activeStep === "curso" ? "page" : undefined}
          >
            Curso e centro
          </Button>
          <CloseApplicationButton />
        </nav>

        {activeStep === "dados" ? (
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
              <CardDescription>
                Identificação, residência e formação académica
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  <LockKeyhole /> Bloqueado
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <Detail label="Nome completo" value={user.fullName} wide />
                <Detail label="Data de nascimento" value={date} />
                <Detail label="Género" value={user.gender} />
                <Detail label="Nacionalidade" value={user.nationality} />
                <Detail label="Documento" value={user.idNumber} />
                <Detail label="Telefone" value={user.phone} />
                <Detail label="E-mail" value={user.email || "Não indicado"} />
                <Detail label="Província" value={user.province} />
                <Detail label="Distrito" value={user.district} />
                <Detail
                  label="Escola ou instituição"
                  value={user.school || "Não indicado"}
                  wide
                />
                <Detail
                  label="Nível académico"
                  value={user.academicLevel || "Não indicado"}
                />
                {user.academicLevel === "Ensino médio" && (
                  <Detail
                    label="Grupo"
                    value={user.academicGroup || "Não indicado"}
                  />
                )}
                {user.academicLevel === "Técnico-profissional" && (
                  <Detail
                    label="Área de formação"
                    value={user.trainingArea || "Não indicada"}
                  />
                )}
                {user.academicLevel === "Ensino superior" && (
                  <Detail
                    label="Curso anterior"
                    value={user.educationCourse || "Não indicado"}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ) : user.application ? (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da candidatura</CardTitle>
              <CardDescription>
                A sua candidatura foi registada com sucesso.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  <LockKeyhole /> Bloqueado
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Detail
                label="Curso selecionado"
                value={
                  user.application.course.plan
                    ? `${user.application.course.name} — Plano ${user.application.course.plan}`
                    : user.application.course.name
                }
              />
              <Detail label="Sigla" value={user.application.course.shortName} />
              <Detail
                label="Centro de recursos"
                value={user.application.resourceCenter.name}
              />
              <Detail
                label="Localização"
                value={user.application.resourceCenter.location}
              />
              <Detail
                label="Data de submissão"
                value={new Intl.DateTimeFormat("pt-MZ", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(user.application.submittedAt)}
              />
            </CardContent>
          </Card>
        ) : period.state !== "open" ? (
          <PeriodNotice message={period.message} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Curso e centro de recursos</CardTitle>
              <CardDescription>Conclua a sua candidatura.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationForm courses={courses} centers={centers} />
            </CardContent>
          </Card>
        )}
        <Alert>
          <AlertTitle>Precisa de ajuda?</AlertTitle>
          <AlertDescription>
            Contacte os serviços académicos do seu centro de recursos.
          </AlertDescription>
        </Alert>
      </div>
    </AuthShell>
  )
}
