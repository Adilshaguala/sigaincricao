import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { redirect } from "next/navigation"

import { AdminLoginForm } from "@/components/admin-login-form"
import { Brand } from "@/components/brand"
import { getCurrentAdmin } from "@/lib/admin-auth"

export default async function AdminPage() {
  const administrator = await getCurrentAdmin()
  if (administrator) redirect("/admin/dashboard")

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-slate-950 px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,.12),transparent_35%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex justify-center"><Brand light href="/admin" /></div>
        <section className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-800"><ShieldCheck className="size-5" /></span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Área administrativa</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Acesso reservado aos gestores do sistema de inscrições.</p>
          <div className="mt-7"><AdminLoginForm /></div>
        </section>
        <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-white"><ArrowLeft className="size-4" /> Voltar ao formulário de inscrição</Link>
      </div>
    </main>
  )
}
