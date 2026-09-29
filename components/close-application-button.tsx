"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"

import { startNewRegistration } from "@/app/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function CloseApplicationButton() {
  const [pending, startTransition] = useTransition()

  function closeApplication() {
    startTransition(() => startNewRegistration())
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Fechar candidatura"
          />
        }
      >
        <LogOut />
        Fechar
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <LogOut />
          </AlertDialogMedia>
          <AlertDialogTitle>Fechar candidatura?</AlertDialogTitle>
          <AlertDialogDescription>
            Voltará à página inicial. Não se preocupe, a sua candidatura esta guardada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Continuar aqui
          </AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={closeApplication}>
            <LogOut />
            {pending ? "A fechar..." : "Fechar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
