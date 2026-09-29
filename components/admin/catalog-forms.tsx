"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Clock,
  GraduationCap,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import {
  createCourse,
  createResourceCenter,
  updateCourse,
  updateResourceCenter,
  type ConfigurationActionState,
} from "@/app/admin/(portal)/configuracoes/actions"
import { SubmitButton } from "@/components/submit-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const initialState: ConfigurationActionState = {}

export function CourseCreateForm({
  centers,
  levels,
  course,
}: {
  centers: { id: string; name: string }[]
  levels: { id: string; name: string }[]
  course?: {
    id: string
    name: string
    plan: string | null
    duration: number | null
    levelId: string | null
    centerIds: string[]
  }
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(!course)
  const [state, action] = useActionState(
    async (previous: ConfigurationActionState, formData: FormData) => {
      const result = course
        ? await updateCourse(course.id, previous, formData)
        : await createCourse(previous, formData)
      if (course && result.success) setEditing(false)
      return result
    },
    initialState
  )
  const [name, setName] = useState(course?.name ?? "")
  const [plan, setPlan] = useState(course?.plan ?? "")
  const [duration, setDuration] = useState(String(course?.duration ?? 4))
  const [levelId, setLevelId] = useState(course?.levelId ?? "")
  const [centerIds, setCenterIds] = useState<string[]>(course?.centerIds ?? [])

  function cancel() {
    if (!course) return
    setName(course.name)
    setPlan(course.plan ?? "")
    setDuration(String(course.duration ?? 4))
    setLevelId(course.levelId ?? "")
    setCenterIds(course.centerIds)
    setEditing(false)
  }

  useEffect(() => {
    if (!course && state.revision && state.success)
      router.push("/admin/configuracoes/cursos")
  }, [state.revision, state.success, course, router])

  return (
    <form
      action={action}
      noValidate
      className={
        course ? "grid gap-5" : "mt-5 grid w-full max-w-3xl content-start gap-4"
      }
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível criar o curso</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {course && state.success && (
        <Alert>
          <AlertTitle>Curso actualizado</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}
      {!centers.length && (
        <Alert>
          <AlertTitle>Sem centros disponíveis</AlertTitle>
          <AlertDescription>
            Crie primeiro um{" "}
            <Link href="/admin/configuracoes/centros" className="underline">
              centro de recursos
            </Link>{" "}
            para poder associar o curso.
          </AlertDescription>
        </Alert>
      )}
      {!levels.length && (
        <Alert>
          <AlertTitle>Sem graus académicos</AlertTitle>
          <AlertDescription>
            Execute o seeder para disponibilizar os graus académicos.
          </AlertDescription>
        </Alert>
      )}
      {!course && (
        <div className="mb-1">
          <h1 className="text-xl font-bold">Adicionar Curso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione novo curso à base de dados, certifique-se de preencher
            todos dados pedidos.
          </p>
        </div>
      )}
      {course && (
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Editar Curso</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? "Faça as alterações e confirme no fim."
                : "Clique em Editar para modificar os dados do curso."}
            </p>
          </div>
          {editing ? (
            <Button type="button" variant="ghost" onClick={cancel}>
              <X />
              Cancelar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil />
              Editar
            </Button>
          )}
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_7rem_9rem]">
        <Field data-invalid={Boolean(state.fieldErrors?.name?.[0])}>
          <FieldLabel htmlFor="course-name">Nome</FieldLabel>
          <Input
            id="course-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Informe o nome do curso"
            disabled={!editing}
            required
            aria-invalid={Boolean(state.fieldErrors?.name?.[0])}
          />
          <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.plan?.[0])}>
          <FieldLabel htmlFor="course-plan">Plano</FieldLabel>
          <Input
            id="course-plan"
            name="plan"
            value={plan}
            onChange={(event) =>
              setPlan(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 1)
              )
            }
            placeholder="Ex.: B"
            maxLength={1}
            disabled={!editing}
            required
            aria-invalid={Boolean(state.fieldErrors?.plan?.[0])}
          />
          <FieldError>{state.fieldErrors?.plan?.[0]}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.duration?.[0])}>
          <FieldLabel
            htmlFor="course-duration"
            className="flex items-center gap-2"
          >
            <Clock className="size-4" />
            Duração
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupButton
                aria-label="Diminuir duração"
                disabled={!editing || Number(duration) <= 2}
                onClick={() =>
                  setDuration(String(Math.max(2, Number(duration || 2) - 1)))
                }
              >
                <Minus />
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupInput
              id="course-duration"
              name="duration"
              type="number"
              min={2}
              max={8}
              disabled={!editing}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
              aria-invalid={Boolean(state.fieldErrors?.duration?.[0])}
              className="text-center"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Aumentar duração"
                disabled={!editing || Number(duration) >= 8}
                onClick={() =>
                  setDuration(String(Math.min(8, Number(duration || 2) + 1)))
                }
              >
                <Plus />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError>{state.fieldErrors?.duration?.[0]}</FieldError>
        </Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.centerIds?.[0])}>
          <FieldLabel
            htmlFor="course-add-center"
            className="flex items-center gap-2"
          >
            <MapPin className="size-4" />
            Centros de recursos
          </FieldLabel>
          {centerIds.map((id) => {
            const center = centers.find((item) => item.id === id)
            return (
              <div key={id} className="flex items-center gap-2">
                <NativeSelect
                  className="w-full"
                  value={id}
                  disabled={!editing}
                  aria-label="Centro de recursos seleccionado"
                  onChange={(event) =>
                    setCenterIds((current) =>
                      current.map((value) =>
                        value === id ? event.target.value : value
                      )
                    )
                  }
                >
                  {centers
                    .filter(
                      (item) => item.id === id || !centerIds.includes(item.id)
                    )
                    .map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
                <input type="hidden" name="centerIds" value={id} />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label={`Remover ${center?.name ?? "centro"}`}
                  disabled={!editing}
                  onClick={() =>
                    setCenterIds((current) =>
                      current.filter((item) => item !== id)
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })}
          {centerIds.length < centers.length && (
            <NativeSelect
              id="course-add-center"
              className="w-full"
              value=""
              disabled={!editing}
              onChange={(event) => {
                if (event.target.value)
                  setCenterIds((current) => [...current, event.target.value])
              }}
              aria-invalid={Boolean(state.fieldErrors?.centerIds?.[0])}
            >
              <NativeSelectOption value="">
                Seleccione outro centro de recursos
              </NativeSelectOption>
              {centers
                .filter((center) => !centerIds.includes(center.id))
                .map((center) => (
                  <NativeSelectOption key={center.id} value={center.id}>
                    {center.name}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          )}
          <FieldError>{state.fieldErrors?.centerIds?.[0]}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.academicLevelId?.[0])}>
          <FieldLabel
            htmlFor="course-level"
            className="flex items-center gap-2"
          >
            <GraduationCap className="size-4" />
            Grau académico
          </FieldLabel>
          <NativeSelect
            id="course-level"
            className="w-full"
            name="academicLevelId"
            value={levelId}
            onChange={(event) => setLevelId(event.target.value)}
            disabled={!editing}
            required
            aria-invalid={Boolean(state.fieldErrors?.academicLevelId?.[0])}
          >
            <NativeSelectOption value="">
              Seleccione o grau académico
            </NativeSelectOption>
            {levels.map((level) => (
              <NativeSelectOption key={level.id} value={level.id}>
                {level.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.academicLevelId?.[0]}</FieldError>
        </Field>
      </div>
      {editing && (
        <div className="mt-2 flex justify-center gap-2">
          {centers.length && levels.length ? (
            <SubmitButton
              pendingLabel={course ? "A guardar..." : "A adicionar..."}
            >
              <Plus />
              {course ? "Guardar alterações" : "Adicionar curso"}
            </SubmitButton>
          ) : (
            <Button type="button" disabled>
              <Plus />
              Adicionar curso
            </Button>
          )}
        </div>
      )}
    </form>
  )
}

export function CenterCreateForm({
  onCreated,
  center,
}: {
  onCreated?: () => void
  center?: { id: string; name: string; location: string }
}) {
  const [editing, setEditing] = useState(!center)
  const [state, action] = useActionState(
    async (previous: ConfigurationActionState, formData: FormData) => {
      const result = center
        ? await updateResourceCenter(center.id, previous, formData)
        : await createResourceCenter(previous, formData)
      if (center && result.success) setEditing(false)
      return result
    },
    initialState
  )
  const [name, setName] = useState(center?.name ?? "")
  const [location, setLocation] = useState(center?.location ?? "")

  function cancel() {
    if (!center) return
    setName(center.name)
    setLocation(center.location)
    setEditing(false)
  }

  useEffect(() => {
    if (!center && state.revision && state.success) onCreated?.()
  }, [state.revision, state.success, onCreated, center])

  return (
    <form action={action} noValidate className="grid gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível guardar</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {center && (
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Centro de recursos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? "Actualize os dados do centro."
                : "Visualize os dados do centro."}
            </p>
          </div>
          {!editing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil />
              Editar
            </Button>
          )}
        </div>
      )}
      <Field data-invalid={Boolean(state.fieldErrors?.name?.[0])}>
        <FieldLabel htmlFor="center-name">Nome</FieldLabel>
        <Input
          id="center-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do centro"
          disabled={!editing}
          required
          aria-invalid={Boolean(state.fieldErrors?.name?.[0])}
        />
        <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
      </Field>
      <Field data-invalid={Boolean(state.fieldErrors?.location?.[0])}>
        <FieldLabel htmlFor="center-location">Localização</FieldLabel>
        <Input
          id="center-location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Localização do centro"
          disabled={!editing}
          required
          aria-invalid={Boolean(state.fieldErrors?.location?.[0])}
        />
        <FieldError>{state.fieldErrors?.location?.[0]}</FieldError>
      </Field>
      {state.success && (center || !onCreated) && (
        <Alert>
          <AlertTitle>
            {center ? "Centro actualizado" : "Centro criado"}
          </AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}
      {editing && (
        <div className="mt-2 flex justify-center gap-2">
          <SubmitButton pendingLabel="A guardar...">
            {center ? "Guardar alterações" : "Submeter"}
          </SubmitButton>
          {center && (
            <Button type="button" variant="outline" onClick={cancel}>
              <X />
              Cancelar
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
