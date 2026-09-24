"use client"

import { CalendarClock, Plus } from "lucide-react"
import { useActionState, useState } from "react"

import {
  createCourse,
  createResourceCenter,
  updateRegistrationPeriod,
  type ConfigurationActionState,
} from "@/app/admin/(portal)/configuracoes/actions"
import {
  ErrorBanner,
  ErrorSummary,
  Field,
  Input,
  SuccessBanner,
} from "@/components/form-controls"
import { SubmitButton } from "@/components/submit-button"

const initialState: ConfigurationActionState = {}

export function RegistrationPeriodForm({
  initialStart,
  initialEnd,
}: {
  initialStart: string
  initialEnd: string
}) {
  const [state, action] = useActionState(updateRegistrationPeriod, initialState)
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  return (
    <form action={action} noValidate className="grid gap-5">
      <ErrorBanner message={state.error} />
      <ErrorSummary fieldErrors={state.fieldErrors} />
      <SuccessBanner message={state.success} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Abertura das inscrições"
          hint="Deixe vazio para permitir inscrições imediatamente."
          error={state.fieldErrors?.registrationStart?.[0]}
        >
          <Input
            type="datetime-local"
            name="registrationStart"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.registrationStart?.[0])}
          />
        </Field>
        <Field
          label="Encerramento das inscrições"
          hint="Deixe vazio para não definir uma data de encerramento."
          error={state.fieldErrors?.registrationEnd?.[0]}
        >
          <Input
            type="datetime-local"
            name="registrationEnd"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.registrationEnd?.[0])}
          />
        </Field>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <SubmitButton pendingLabel="A guardar...">
          <CalendarClock /> Guardar prazo
        </SubmitButton>
      </div>
    </form>
  )
}

export function CreateCourseForm() {
  const [state, action] = useActionState(createCourse, initialState)
  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")

  return (
    <form action={action} noValidate className="grid gap-4">
      <ErrorBanner message={state.error} />
      <ErrorSummary fieldErrors={state.fieldErrors} />
      <SuccessBanner message={state.success} />
      <Field label="Nome do curso" error={state.fieldErrors?.name?.[0]}>
        <Input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Licenciatura em Direito"
          aria-invalid={Boolean(state.fieldErrors?.name?.[0])}
          required
        />
      </Field>
      <Field
        label="Sigla"
        hint="Será convertida automaticamente para maiúsculas."
        error={state.fieldErrors?.shortName?.[0]}
      >
        <Input
          name="shortName"
          value={shortName}
          onChange={(event) => setShortName(event.target.value.toUpperCase())}
          placeholder="Ex.: LD"
          maxLength={12}
          aria-invalid={Boolean(state.fieldErrors?.shortName?.[0])}
          required
        />
      </Field>
      <div className="flex justify-end pt-1">
        <SubmitButton pendingLabel="A criar...">
          <Plus /> Criar curso
        </SubmitButton>
      </div>
    </form>
  )
}

export function CreateResourceCenterForm() {
  const [state, action] = useActionState(createResourceCenter, initialState)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")

  return (
    <form action={action} noValidate className="grid gap-4">
      <ErrorBanner message={state.error} />
      <ErrorSummary fieldErrors={state.fieldErrors} />
      <SuccessBanner message={state.success} />
      <Field label="Nome do centro" error={state.fieldErrors?.name?.[0]}>
        <Input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Centro de Recursos de Chimoio"
          aria-invalid={Boolean(state.fieldErrors?.name?.[0])}
          required
        />
      </Field>
      <Field label="Localização" error={state.fieldErrors?.location?.[0]}>
        <Input
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Ex.: Manica"
          aria-invalid={Boolean(state.fieldErrors?.location?.[0])}
          required
        />
      </Field>
      <div className="flex justify-end pt-1">
        <SubmitButton pendingLabel="A criar...">
          <Plus /> Criar centro
        </SubmitButton>
      </div>
    </form>
  )
}
