"use client"

import {
  useActionState,
  useEffect,
  useTransition,
  useRef,
  type FormEvent,
} from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { unstable_rethrow } from "next/navigation"
import { ArrowRight, CircleAlert } from "lucide-react"
import type { z } from "zod"

import { submitApplication, type FormState } from "@/app/actions"
import { applicationSchema } from "@/lib/registration-schema"
import { CourseFields } from "@/components/enrollment-fields"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FieldDescription } from "@/components/ui/field"

type Values = z.input<typeof applicationSchema>

export function ApplicationForm({
  courses,
  centers,
}: {
  courses: { id: string; name: string }[]
  centers: { id: string; name: string; location: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)
  const form = useForm<Values>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { courseId: "", resourceCenterId: "", declaration: "" },
    mode: "onSubmit",
    disabled: pending,
  })
  const [state, action] = useActionState(
    async (previous: FormState, data: FormData) => {
      try {
        const result = await submitApplication(previous, data)
        for (const [name, messages] of Object.entries(
          result.fieldErrors ?? {}
        )) {
          if (name in applicationSchema.shape && messages?.[0]) {
            form.setError(
              name as keyof Values,
              { type: "server", message: messages[0] },
              { shouldFocus: true }
            )
          }
        }
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
    {}
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitting.current) return
    await form.handleSubmit((values) => {
      if (submitting.current) return
      submitting.current = true
      const data = new FormData()
      Object.entries(values).forEach(([key, value]) => data.set(key, value))
      startTransition(() => action(data))
    })()
  }

  useEffect(() => {
    if (pending) return
    const first = Object.keys(state.fieldErrors ?? {})[0]
    const frame = requestAnimationFrame(() => {
      if (first && first in applicationSchema.shape)
        form.setFocus(first as keyof Values)
      else if (state.error)
        document.getElementById("application-error")?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [state, pending, form])

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
        {state.error && !pending && (
          <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50" id="application-error" tabIndex={-1} variant="destructive">
            <CircleAlert />
            <AlertTitle>Não foi possível submeter</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {unavailable && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Opções indisponíveis</AlertTitle>
            <AlertDescription>
              Contacte os serviços académicos para obter informações sobre os
              cursos e centros disponíveis.
            </AlertDescription>
          </Alert>
        )}
        <CourseFields courses={courses} centers={centers} />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || unavailable}>
            {pending ? <Spinner /> : <ArrowRight />}
            {pending ? "A submeter..." : "Submeter inscrição"}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
