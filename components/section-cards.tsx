import { UsersRound, FileCheck2, Clock3, CalendarCheck2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards({
  data,
}: {
  data: {
    totalCandidates: number
    totalSubmitted: number
    pending: number
    submittedThisMonth: number
    activeCenters: number
  }
}) {
  const cards = [
    {
      label: "Candidatos registados",
      value: data.totalCandidates,
      helper: "Candidatos guardados no sistema",
      icon: UsersRound,
    },
    {
      label: "Inscrições submetidas",
      value: data.totalSubmitted,
      helper: "Curso e centro confirmados",
      icon: FileCheck2,
    },
    {
      label: "Por concluir",
      value: data.pending,
      helper: "Registos anteriores sem submissão final",
      icon: Clock3,
    },
    {
      label: "Submetidas este mês",
      value: data.submittedThisMonth,
      helper: `${data.activeCenters} centros de recursos activos`,
      icon: CalendarCheck2,
    },
  ]
  return (
    <section
      aria-label="Resumo das inscrições"
      className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4 "
    >
      {cards.map(({ label, value, helper, icon: Icon }) => (
        <Card key={label} className="@container/card">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {value.toLocaleString("pt-MZ")}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Icon aria-hidden="true" />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter>
            <CardDescription>{helper}</CardDescription>
          </CardFooter>
        </Card>
      ))}
    </section>
  )
}
