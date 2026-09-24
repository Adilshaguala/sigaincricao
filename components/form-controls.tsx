"use client"

import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react"
import { CheckCircle2, CircleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Field as ShadcnField,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"

export { Input } from "@/components/ui/input"
export { NativeSelect as Select } from "@/components/ui/native-select"

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const generatedId = useId()
  const child = Children.only(children)
  const control = isValidElement(child)
    ? (child as ReactElement<{ id?: string; "aria-describedby"?: string }>)
    : null
  const id = control?.props.id ?? generatedId
  const descriptionId = `${id}-description`
  return (
    <ShadcnField className={className} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {control
        ? cloneElement(control, {
            id,
            "aria-describedby":
              [
                control.props["aria-describedby"],
                error || hint ? descriptionId : undefined,
              ]
                .filter(Boolean)
                .join(" ") || undefined,
          })
        : children}
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <FieldDescription id={descriptionId}>{hint}</FieldDescription>
      ) : null}
    </ShadcnField>
  )
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <Alert role="status">
      <CheckCircle2 />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function ErrorSummary({
  fieldErrors,
}: {
  fieldErrors?: Record<string, string[] | undefined>
}) {
  const count = Object.values(fieldErrors ?? {}).filter(
    (messages) => messages?.length
  ).length
  if (!count) return null
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>
        {count === 1
          ? "Um campo precisa de atenção."
          : `${count} campos precisam de atenção.`}
      </AlertTitle>
      <AlertDescription>
        Corrija os campos assinalados. Os restantes dados foram mantidos.
      </AlertDescription>
    </Alert>
  )
}
