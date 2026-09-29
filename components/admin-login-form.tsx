"use client"

import { LogIn } from "lucide-react"
import { useActionState, useState } from "react"

import { loginAdmin, type AdminLoginState } from "@/app/admin/actions"
import { ErrorBanner, Field, Input } from "@/components/form-controls"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const initialState: AdminLoginState = {}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  return (
    <form action={action} noValidate className="grid gap-5">
      <ErrorBanner message={state.error} />
      <Field
        label="Nome de utilizador"
        error={state.fieldErrors?.username?.[0]}
      >
        <Input
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.username?.[0])}
          autoComplete="username"
          placeholder="Introduza o utilizador"
          required
        />
      </Field>
      <Field label="Senha" error={state.fieldErrors?.password?.[0]}>
        <Input
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.password?.[0])}
          type="password"
          autoComplete="current-password"
          placeholder="Introduza a senha"
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner /> : <LogIn />}
        {pending ? "A entrar..." : "Entrar na administração"}
      </Button>
    </form>
  )
}
