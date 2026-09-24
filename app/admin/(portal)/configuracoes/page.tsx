import {
  BookOpen,
  Building2,
  CalendarClock,
  CircleCheckBig,
  CirclePause,
  Clock3,
  Power,
  Settings2,
} from "lucide-react"

import {
  toggleCourse,
  toggleResourceCenter,
} from "@/app/admin/(portal)/configuracoes/actions"
import {
  CreateCourseForm,
  CreateResourceCenterForm,
  RegistrationPeriodForm,
} from "@/components/admin/configuration-forms"
import { Button } from "@/components/ui/button"
import { getConfigurationData } from "@/lib/admin-data"
import { getCatalog } from "@/lib/catalog"
import {
  formatRegistrationDate,
  getRegistrationPeriod,
  toDateTimeLocal,
  type RegistrationState,
} from "@/lib/registration-settings"
import { cn } from "@/lib/utils"

const stateLabels: Record<RegistrationState, string> = {
  open: "Inscrições abertas",
  upcoming: "Aguardando abertura",
  closed: "Inscrições encerradas",
}

const stateStyles: Record<RegistrationState, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-800",
  upcoming: "border-amber-200 bg-amber-50 text-amber-800",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
}

const stateIcons = {
  open: CircleCheckBig,
  upcoming: Clock3,
  closed: CirclePause,
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500",
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  )
}

export default async function ConfigurationPage() {
  await getCatalog()
  const [data, period] = await Promise.all([getConfigurationData(), getRegistrationPeriod()])
  const PeriodIcon = stateIcons[period.state]

  return (
    <div className="grid gap-7">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-emerald-700 uppercase">
          Administração
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Configurações
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Defina o prazo e os dados disponíveis no formulário de inscrição.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CalendarClock className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Prazo das inscrições</h2>
              <p className="mt-1 text-xs text-slate-500">
                Horário de Moçambique (Africa/Maputo)
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
              stateStyles[period.state],
            )}
          >
            <PeriodIcon className="size-3.5" />
            {stateLabels[period.state]}
          </span>
        </div>
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_2fr]">
          <div className={cn("rounded-xl border p-4", stateStyles[period.state])}>
            <p className="text-sm font-semibold">Estado actual</p>
            <p className="mt-1 text-sm leading-6 opacity-80">{period.message}</p>
            <dl className="mt-4 grid gap-3 border-t border-current/10 pt-4 text-xs">
              <div>
                <dt className="font-medium opacity-60">Abertura</dt>
                <dd className="mt-1 font-semibold">
                  {period.start ? formatRegistrationDate(period.start) : "Sem limite inicial"}
                </dd>
              </div>
              <div>
                <dt className="font-medium opacity-60">Encerramento</dt>
                <dd className="mt-1 font-semibold">
                  {period.end ? formatRegistrationDate(period.end) : "Sem limite final"}
                </dd>
              </div>
            </dl>
          </div>
          <RegistrationPeriodForm
            initialStart={toDateTimeLocal(data.settings?.registrationStart ?? null)}
            initialEnd={toDateTimeLocal(data.settings?.registrationEnd ?? null)}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
              <BookOpen className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Novo curso</h2>
              <p className="mt-1 text-xs text-slate-500">Adicione uma opção ao formulário público.</p>
            </div>
          </div>
          <CreateCourseForm />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">Cursos</h2>
              <p className="mt-1 text-xs text-slate-500">{data.courses.length} registados</p>
            </div>
            <Settings2 className="size-5 text-slate-300" />
          </div>
          <div className="divide-y divide-slate-100">
            {data.courses.map((course) => {
              const toggleAction = toggleCourse.bind(null, course.id)
              return (
                <div key={course.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    {course.shortName}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{course.name}</p>
                      <StatusBadge active={course.active} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {course._count.applications.toLocaleString("pt-MZ")} inscrições
                    </p>
                  </div>
                  <form action={toggleAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className={course.active ? "text-slate-600" : "text-emerald-700"}
                      title={course.active ? "Desactivar curso" : "Activar curso"}
                    >
                      <Power />
                      <span className="hidden sm:inline">
                        {course.active ? "Desactivar" : "Activar"}
                      </span>
                    </Button>
                  </form>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Novo centro</h2>
              <p className="mt-1 text-xs text-slate-500">Adicione um centro de recursos.</p>
            </div>
          </div>
          <CreateResourceCenterForm />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">Centros de recursos</h2>
              <p className="mt-1 text-xs text-slate-500">{data.centers.length} registados</p>
            </div>
            <Building2 className="size-5 text-slate-300" />
          </div>
          <div className="divide-y divide-slate-100">
            {data.centers.map((center) => {
              const toggleAction = toggleResourceCenter.bind(null, center.id)
              return (
                <div key={center.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{center.name}</p>
                      <StatusBadge active={center.active} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {center.location} · {center._count.applications.toLocaleString("pt-MZ")} inscrições
                    </p>
                  </div>
                  <form action={toggleAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className={center.active ? "text-slate-600" : "text-emerald-700"}
                      title={center.active ? "Desactivar centro" : "Activar centro"}
                    >
                      <Power />
                      <span className="hidden sm:inline">
                        {center.active ? "Desactivar" : "Activar"}
                      </span>
                    </Button>
                  </form>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
