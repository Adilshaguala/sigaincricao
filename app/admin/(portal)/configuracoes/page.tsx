import {
  CalendarClock,
  CircleCheckBig,
  CirclePause,
  Clock3,
} from "lucide-react"

import { RegistrationPeriodForm } from "@/components/admin/configuration-forms"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getConfigurationData } from "@/lib/admin-data"
import {
  formatRegistrationDate,
  getRegistrationPeriod,
  toDateTimeLocal,
  type RegistrationState,
} from "@/lib/registration-settings"

const stateLabels: Record<RegistrationState, string> = {
  open: "Candidaturas abertas",
  upcoming: "Aguardando abertura",
  closed: "Candidaturas encerradas",
}

const stateIcons = {
  open: CircleCheckBig,
  upcoming: Clock3,
  closed: CirclePause,
}

export default async function ConfigurationPage() {
  const [data, period] = await Promise.all([
    getConfigurationData(),
    getRegistrationPeriod(),
  ])
  const PeriodIcon = stateIcons[period.state]

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Defina o prazo das candidaturas. Os cursos e centros têm páginas
          próprias neste menu.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>
              <CalendarClock
                className="mr-2 inline size-4"
                aria-hidden="true"
              />
              Prazo das candidaturas
            </h2>
          </CardTitle>
          <CardDescription>
            Datas no horário de Moçambique (Africa/Maputo)
          </CardDescription>
          <CardAction>
            <Badge variant={period.state === "open" ? "default" : "secondary"}>
              <PeriodIcon />
              {stateLabels[period.state]}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Alert role="status">
              <PeriodIcon />
              <AlertTitle>Estado actual</AlertTitle>
              <AlertDescription>{period.message}</AlertDescription>
            </Alert>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Abertura</dt>
                <dd className="font-medium">
                  {period.start
                    ? formatRegistrationDate(period.start)
                    : "Sem limite inicial"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Encerramento</dt>
                <dd className="font-medium">
                  {period.end
                    ? formatRegistrationDate(period.end)
                    : "Sem limite final"}
                </dd>
              </div>
            </dl>
          </div>
          <RegistrationPeriodForm
            initialStart={toDateTimeLocal(
              data.settings?.registrationStart ?? null
            )}
            initialEnd={toDateTimeLocal(data.settings?.registrationEnd ?? null)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
