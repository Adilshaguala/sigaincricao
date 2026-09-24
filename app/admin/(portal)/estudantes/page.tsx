import Link from "next/link"
import { ArrowUpRight, Download, Search, SlidersHorizontal, UsersRound } from "lucide-react"

import { getStudents } from "@/lib/admin-data"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; courseId?: string }>
}) {
  const params = await searchParams
  const data = await getStudents({ query: params.q, courseId: params.courseId })
  const exportParams = new URLSearchParams()
  if (data.query) exportParams.set("q", data.query)
  if (data.courseId) exportParams.set("courseId", data.courseId)
  const exportHref = `/admin/estudantes/exportar${exportParams.size ? `?${exportParams.toString()}` : ""}`

  return (
    <div className="grid gap-7">
      <div>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="text-xl font-semibold  ">Estudantes inscritos</h1><p className="mt-2 text-sm">Consulte os candidatos que concluíram e submeteram a inscrição.</p></div>
          <div className="flex flex-wrap items-center gap-3"><div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800"><UsersRound className="size-3.5" /> {data.total} {data.total === 1 ? "estudante" : "estudantes"}</div><a href={exportHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"><Download className="size-4" /> Exportar Excel</a></div>
        </div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_minmax(220px,0.4fr)_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={data.query} placeholder="Pesquisar por nome, documento ou telefone" className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10" />
        </label>
        <select name="courseId" defaultValue={data.courseId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10">
          <option value="">Todos os cursos</option>
          {data.courses.map((course) => <option key={course.id} value={course.id}>{course.shortName} · {course.name}</option>)}
        </select>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"><SlidersHorizontal className="size-4" /> Filtrar</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {data.students.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 border-collapse text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wide text-slate-500 uppercase"><th className="px-5 py-3.5">Estudante</th><th className="px-5 py-3.5">Contacto</th><th className="px-5 py-3.5">Curso</th><th className="px-5 py-3.5">Centro</th><th className="px-5 py-3.5">Submissão</th><th className="w-14 px-5 py-3.5"><span className="sr-only">Abrir</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.students.map((student) => {
                  if (!student.application) return null
                  return (
                    <tr key={student.id} className="group transition hover:bg-slate-50/80">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{student.fullName.split(" ").slice(0, 2).map((name) => name[0]).join("").toUpperCase()}</span><div><p className="text-sm font-semibold text-slate-800">{student.fullName}</p><p className="mt-0.5 text-xs text-slate-400">Documento {student.idNumber}</p></div></div></td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-700">{student.phone}</p><p className="mt-0.5 text-xs text-slate-400">{student.email || "Sem e-mail"}</p></td>
                      <td className="px-5 py-4"><span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{student.application.course.shortName}</span></td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-700">{student.application.resourceCenter.location}</p></td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-700">{new Intl.DateTimeFormat("pt-MZ", { day: "2-digit", month: "short", year: "numeric" }).format(student.application.submittedAt)}</p></td>
                      <td className="px-5 py-4"><Link href={`/admin/estudantes/${student.id}`} aria-label={`Abrir dados de ${student.fullName}`} className="grid size-8 place-items-center rounded-lg text-slate-400 transition group-hover:bg-white group-hover:text-emerald-700 group-hover:shadow-sm"><ArrowUpRight className="size-4" /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid place-items-center px-6 py-20 text-center"><span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><UsersRound className="size-5" /></span><h2 className="mt-4 font-semibold text-slate-800">Nenhum estudante encontrado</h2><p className="mt-1 text-sm text-slate-500">Tente alterar os termos da pesquisa ou os filtros.</p><Link href="/admin/estudantes" className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-900">Limpar filtros</Link></div>
        )}
      </section>
      {data.total > 100 && <p className="text-center text-xs text-slate-400">A apresentar os primeiros 100 resultados. Utilize a pesquisa para refinar a lista.</p>}
    </div>
  )
}
