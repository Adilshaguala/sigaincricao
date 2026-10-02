"use client"

import { Pencil, Send } from "lucide-react"

import type { RegistrationValues } from "@/lib/registration-schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Course = { id: string; name: string }
type Center = { id: string; name: string; location: string }

type Item = { label: string; value?: string }
type Section = { title: string; items: Item[] }

// "2005-03-21" -> "21/03/2005" (sem usar Date, evitando erros de fuso horário)
function formatDate(iso: string) {
  const [year, month, day] = iso.split("-")
  return year && month && day ? `${day}/${month}/${year}` : iso
}

function buildSections(
  values: RegistrationValues,
  courses: Course[],
  centers: Center[]
): Section[] {
const course = courses.find((item) => item.id === values.courseId)
const center = centers.find((item) => item.id === values.resourceCenterId)

  const academic: Item[] = [
    { label: "Escola ou instituição", value: values.school },
    { label: "Nível académico", value: values.academicLevel },
  ]
  if (values.academicLevel === "Ensino médio")
    academic.push({ label: "Grupo", value: values.academicGroup })
  if (values.academicLevel === "Técnico-profissional")
    academic.push({ label: "Área de formação", value: values.trainingArea })
  if (values.academicLevel === "Ensino superior")
    academic.push({ label: "Curso anterior", value: values.educationCourse })

  return [
    {
      title: "Identificação pessoal",
      items: [
        { label: "Nome completo", value: values.fullName },
        { label: "Data de nascimento", value: formatDate(values.birthDate) },
        { label: "Género", value: values.gender },
        { label: "Nacionalidade", value: values.nationality },
        { label: "N.º do BI", value: values.idNumber },
        { label: "Telefone", value: values.phone },
        { label: "E-mail", value: values.email },
      ],
    },
    {
      title: "Residência",
      items: [
        { label: "Província", value: values.province },
        { label: "Distrito", value: values.district },
      ],
    },
    { title: "Formação académica", items: academic },
    {
      title: "Curso e centro",
      items: [
        { label: "Curso", value: course?.name },
        {
          label: "Centro",
          value: center ? `${center.name} (${center.location})` : undefined,
        },
      ],
    },
  ]
}

export function RegistrationReviewDialog({
  values,
  courses,
  centers,
  onCancel,
  onConfirm,
}: {
  values: RegistrationValues | null
  courses: Course[]
  centers: Center[]
  onCancel: () => void
  onConfirm: () => void
}) {
  const sections = values ? buildSections(values, courses, centers) : []

  return (
    <Dialog
      open={values !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle>Reveja a sua candidatura</DialogTitle>
          <DialogDescription>
            Confirme que todos os dados estão correctos. Depois de submetida,
            a candidatura não poderá ser alterada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
              <dl className="divide-y rounded-md border text-sm">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-1 px-3 py-2 sm:grid-cols-[10rem_1fr] sm:gap-4"
                  >
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="break-words font-medium">
                      {item.value?.trim() || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <DialogFooter className="gap-2 border-t p-6 sm:justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            <Pencil data-icon="inline-start" /> Editar dados
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirmar e submeter <Send data-icon="inline-end" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}