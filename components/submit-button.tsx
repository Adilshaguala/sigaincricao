"use client"

import { Spinner } from "@/components/ui/spinner"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

export function SubmitButton({
  children,
  pendingLabel = "A processar...",
}: {
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </Button>
  )
}
