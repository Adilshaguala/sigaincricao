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
    <main className="fixed inset-0 flex flex-col overflow-hidden ">
      <header className="shrink-0 bg-background">
      </header>

      <div className="min-h-0 flex-1 md:py-10 overflow-y-auto bg-[url(/UP.FEP.png)] bg-cover bg-center bg-fixed scroll-bar-hidden">
        <Card className="mx-auto w-full max-w-4xl bg-secondary">
          <CardHeader className="md:flex md:flex-row-reverse  justify-between i">
            <div className="flex  flex-row gap-2 ">
              <img width="100px" src="/up_logo.png" alt="Universidade Pedagógica" />
              <img width="100px" src="/cead_logo.png" alt="ISAD" />
              <img width="100px" src="/ISAD.png" alt="ISAD" />
            </div>
            <div>
              <CardTitle>
                <h1 className=" pt-10 md:pt-0 text-xl font-bold">{title}</h1>
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}