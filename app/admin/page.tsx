import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { redirect } from "next/navigation"

import { AdminLoginForm } from "@/components/admin-login-form"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentAdmin } from "@/lib/admin-auth"

export default async function AdminPage() {
  const administrator = await getCurrentAdmin()
  if (administrator) redirect("/admin/dashboard")

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Card>
          <CardHeader className="text-center flex flex-col items-center">
            <img src="/ISAD.png" width="150px"/>
            <CardTitle className="text-xl">
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="link"
              render={<Link href="/" />}
              nativeButton={false}
            >
              <ArrowLeft />
              Voltar ao formulário de candidatura
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
