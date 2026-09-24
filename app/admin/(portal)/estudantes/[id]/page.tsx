import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  IdCard,
  Mail,
  Phone,
  UserRound,
} from "lucide-react"

import { getStudentDetails } from "@/lib/admin-data"

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`border-b border-slate-100 py-3.5 ${wide ? "sm:col-span-2" : ""}`}><dt className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</dt><dd className="mt-1.5 text-sm font-medium text-slate-800">{value}</dd></div>
}

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await getStudentDetails(id)
  if (!student?.application) notFound()

  const birthDate = new Intl.DateTimeFormat("pt-MZ", { dateStyle: "long", timeZone: "UTC" }).format(student.birthDate)
  const submittedAt = new Intl.DateTimeFormat("pt-MZ", { dateStyle: "long", timeStyle: "short" }).format(student.application.submittedAt)

  return (
    <div className="grid gap-6">
      <div><Link href="/admin/estudantes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"><ArrowLeft className="size-4" /> Voltar aos estudantes</Link><div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold tracking-[0.14em] text-emerald-700 uppercase">Ficha do estudante</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{student.fullName}</h1><p className="mt-2 text-sm text-slate-500">Documento {student.idNumber} · Registo individual da candidatura</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800"><CheckCircle2 className="size-3.5" /> Inscrição submetida</span></div></div>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><UserRound className="size-5" /></span><div><h2 className="font-semibold text-slate-950">Dados pessoais e formação</h2><p className="mt-0.5 text-xs text-slate-500">Informação de identificação, residência e formação anterior</p></div></div>
          <dl className="grid gap-x-8 px-5 py-3 sm:grid-cols-2 sm:px-6">
            <Detail label="Nome completo" value={student.fullName} wide />
            <Detail label="Data de nascimento" value={birthDate} />
            <Detail label="Género" value={student.gender} />
            <Detail label="Nacionalidade" value={student.nationality} />
            <Detail label="Documento" value={student.idNumber} />
            <Detail label="Província" value={student.province} />
            <Detail label="Distrito" value={student.district} />
            <Detail label="Escola ou instituição" value={student.school || "Não indicado"} wide />
            <Detail label="Nível académico" value={student.academicLevel || "Não indicado"} />
            {student.academicLevel === "Ensino médio" && <Detail label="Grupo" value={student.academicGroup || "Não indicado"} />}
            {student.academicLevel === "Técnico-profissional" && <Detail label="Área de formação" value={student.trainingArea || "Não indicada"} />}
            {student.academicLevel === "Ensino superior" && <Detail label="Curso anterior" value={student.educationCourse || "Não indicado"} />}
          </dl>
        </div>

        <div className="grid content-start gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><BookOpen className="size-4" /></span><h2 className="font-semibold text-slate-950">Inscrição académica</h2></div><div className="mt-5 grid gap-4"><div><p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Curso</p><p className="mt-1 text-sm font-semibold text-slate-800">{student.application.course.name}</p><p className="mt-0.5 text-xs text-slate-400">{student.application.course.shortName}</p></div><div className="h-px bg-slate-100" /><div><p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Centro de recursos</p><p className="mt-1 text-sm font-semibold text-slate-800">{student.application.resourceCenter.name}</p><p className="mt-0.5 text-xs text-slate-400">{student.application.resourceCenter.location}</p></div><div className="h-px bg-slate-100" /><div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 text-slate-400" /><div><p className="text-xs text-slate-400">Submetida em</p><p className="mt-0.5 text-sm font-medium text-slate-700">{submittedAt}</p></div></div></div></div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-slate-950">Contactos</h2><div className="mt-4 grid gap-3"><a href={`tel:${student.phone}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><Phone className="size-4 text-emerald-700" /> {student.phone}</a>{student.email ? <a href={`mailto:${student.email}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><Mail className="size-4 text-emerald-700" /> <span className="truncate">{student.email}</span></a> : <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-400"><Mail className="size-4" /> E-mail não indicado</div>}</div></div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400"><IdCard className="size-3.5" /> Identificador interno: {student.id}</div>
    </div>
  )
}
