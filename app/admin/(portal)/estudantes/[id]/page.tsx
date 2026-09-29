import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  IdCard,
  Mail,
  Phone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getStudentDetails } from "@/lib/admin-data"

function Detail({
  label,
  value,
  description,
  wide = false,
}: {
  label: string
  value: string
  description?: string
  wide?: boolean
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">
        {value}
        {description && (
          <span className="block text-xs font-normal text-muted-foreground">
            {description}
          </span>
        )}
      </dd>
    </div>
  )
}

export default async function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudentDetails(id)
  if (!student?.application) notFound()

  const birthDate = new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(student.birthDate)
  const submittedAt = new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(student.application.submittedAt)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin/estudantes" />}
          nativeButton={false}
        >
          <ArrowLeft />
          Voltar aos estudantes
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{student.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              Documento {student.idNumber} · Ficha do estudante
            </p>
          </div>
          <Badge variant="secondary">
            <CheckCircle2 />
            Candidatura submetida
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Dados pessoais e formação</h2>
            </CardTitle>
            <CardDescription>
              Identificação, residência e formação anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Nome completo" value={student.fullName} wide />
              <Detail label="Data de nascimento" value={birthDate} />
              <Detail label="Género" value={student.gender} />
              <Detail label="Nacionalidade" value={student.nationality} />
              <Detail label="Documento" value={student.idNumber} />
              <Detail label="Província" value={student.province} />
              <Detail label="Distrito" value={student.district} />
              <Detail
                label="Escola ou instituição"
                value={student.school || "Não indicado"}
                wide
              />
              <Detail
                label="Nível académico"
                value={student.academicLevel || "Não indicado"}
              />
              {student.academicLevel === "Ensino médio" && (
                <Detail
                  label="Grupo"
                  value={student.academicGroup || "Não indicado"}
                />
              )}
              {student.academicLevel === "Técnico-profissional" && (
                <Detail
                  label="Área de formação"
                  value={student.trainingArea || "Não indicada"}
                />
              )}
              {student.academicLevel === "Ensino superior" && (
                <Detail
                  label="Curso anterior"
                  value={student.educationCourse || "Não indicado"}
                />
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>
                  <BookOpen className="mr-2 inline size-4" aria-hidden="true" />
                  Candidatura académica
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <Detail
                  label="Curso"
                  value={student.application.course.name}
                  description={student.application.course.shortName}
                />
                <Separator />
                <Detail
                  label="Centro de recursos"
                  value={student.application.resourceCenter.name}
                  description={student.application.resourceCenter.location}
                />
                <Separator />
                <div className="flex items-start gap-2">
                  <CalendarDays
                    className="mt-0.5 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Detail label="Submetida em" value={submittedAt} />
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Contactos</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="justify-start"
                render={<a href={"tel:" + student.phone} />}
                nativeButton={false}
              >
                <Phone />
                {student.phone}
              </Button>
              {student.email ? (
                <Button
                  variant="outline"
                  className="max-w-full justify-start"
                  render={<a href={"mailto:" + student.email} />}
                  nativeButton={false}
                >
                  <Mail />
                  <span className="truncate">{student.email}</span>
                </Button>
              ) : (
                <CardDescription>E-mail não indicado</CardDescription>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <IdCard className="size-4" aria-hidden="true" />
        Identificador interno: {student.id}
      </p>
    </div>
  )
}
