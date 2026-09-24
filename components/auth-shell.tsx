import { Brand } from "@/components/brand"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export function AuthShell({
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto grid min-h-svh max-w-3xl content-start gap-6 px-4 py-8 sm:px-6">
      <header>
        <div className="flex flex-row justify-between">
          <img width="100px" src="/ISAD.png" />
          <img width="100px" src="/up_logo.png" />
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
