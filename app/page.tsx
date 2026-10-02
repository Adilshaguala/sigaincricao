import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const steps = [
  {
    number: "01",
    title: "Preencha os seus dados",
    description:
      "Indique os seus dados pessoais, de contacto, residência e formação académica.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Escolha o curso",
    description:
      "Seleccione o curso pretendido e o centro de recursos onde terá apoio académico.",
    icon: GraduationCap,
  },
  {
    number: "03",
    title: "Submeta a candidatura",
    description:
      "Confirme a declaração e submeta. Os dados ficam disponíveis para análise.",
    icon: CheckCircle2,
  },
]

const requirements = [
  "Bilhete de identidade válido",
  "Contacto telefónico activo",
  "Dados da escola ou instituição frequentada",
  "Curso e centro de recursos pretendidos",
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; submitted?: string }>
}) {
  const params = await searchParams
  if (params.step === "dados" || params.step === "curso") {
    const submitted = params.submitted === "1" ? "&submitted=1" : ""
    redirect(`/inscricao?step=${params.step}${submitted}`)
  }

  return (
    <div className="min-h-svh bg-white text-foreground">
      <header className="border-b">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="UP-CEAD — Página inicial"
          >

            <Image
              src="/CEAD_Logo.svg"
              alt="Universidade Pedagógica de Maputo"
              width={112}
              height={64}
              className="h-16 w-auto object-contain"
              priority
            />
            <Separator orientation="vertical" className="h-10" />
            <Image
              src="/ISAD.png"
              alt="Instituto Superior de Educação Aberta e à Distância"
              width={128}
              height={64}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          <Button render={<Link href="/inscricao" />} className="hidden md:flex" nativeButton={false}>
            Candidatar-me
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[60vh] bg-[url(/fundo_inicio.png)] bg-cover bg-fixed">
          {/* Overlay: cobre toda a secção, sem z-index negativo */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

          {/* Conteúdo: relative para ficar acima do overlay */}
          <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-5xl flex-col justify-center gap-6 px-4">
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                A sua formação começa com uma candidatura.
              </h1>
              <p className="max-w-prose text-base leading-7 text-white/80 sm:text-lg">
                Candidate-se aos cursos à Distância da Universidade Pedagógica de Maputo e escolha o Centro de
                Recursos mais adequado para o seu acompanhamento académico.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                render={<Link href="/inscricao" />}
                nativeButton={false}
              >
                Iniciar candidatura
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                className="bg-yellow-300 text-black hover:bg-white/10 hover:text-white"
                render={<Link href="#como-candidatar" />}
                nativeButton={false}
              >
                Como candidatar-me
              </Button>
            </div>
          </div>
        </section>

        <section
          id="como-candidatar"
          aria-labelledby="steps-title"
          className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12"
        >
          <div className="mb-6 max-w-2xl space-y-2 text-black">
            <h2 id="steps-title" className="text-2xl font-bold tracking-tight">
              Candidate-se em três passos
            </h2>
            <p className="font-semibold text-gray-600">
              O formulário é preenchido uma única vez e leva-o por cada etapa
              necessária.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <Card
                key={step.number}
                className="border-2 border-gray-300 bg-white"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <step.icon className="size-8 text-primary" />
                    <Badge variant="secondary">{step.number}</Badge>
                  </div>
                  <CardTitle className="font-bold text-black">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="font-semibold text-gray-600">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#222] p-8 text-white">
        <div className="m-auto flex max-w-6xl flex-wrap gap-8">
          <div className="flex max-w-md min-w-sm flex-1 flex-col gap-2">
            <div className="border-b-2 border-green-300 font-bold text-green-400">
              UP-CEAD
            </div>
            <div className="text-sm">
              <p>
                Somos o Centro de Educação Aberta e à Distância (CEAD) da
                Universidade pedagógica de Maputo. Unidade orgânica que dá
                suporte e acessória a todas as iniciativas e actividades de
                ensino, na modalidade à distância na Universidade.
              </p>
            </div>
          </div>
          <div className="flex max-w-md min-w-sm flex-1 flex-col gap-2">
            <div className="border-b-2 border-green-300">
              <h6 className="font-bold text-green-400">Endereço</h6>
            </div>
            <div className="address-line">
              <p className="text-sm">
                Campus de Lhanguene, Avenida do Trabalho, nº 2482, Bairro
                Chamanculo “C”, Maputo - Moçambique.
                <br />
                up.cead@gmail.com
              </p>
            </div>
          </div>
          <div className="flex max-w-md flex-1 flex-col gap-2">
            <div className="border-b-2 border-green-300">
              <h6 className="font-bold text-green-400">Links Uteis </h6>
            </div>
            <ul className="footer-menu">
              <li>
                <a
                  className="text-decoration-none"
                  href="https://www.up.ac.mz"
                  target="_blank"
                >
                  UP-Maputo
                </a>
              </li>
              <li>
                <a
                  className="text-decoration-none"
                  href="https://sigeup.up.ac.mz/"
                  target="_blank"
                >
                  SIGEUP
                </a>
              </li>
            </ul>
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <div className="border-b-2 border-green-300">
              <h6 className="font-bold text-green-400">Sobre o CEAD</h6>
            </div>
            <ul className="footer-menu">
              <li>
                <a className="text-decoration-none" href="#" target="_blank">
                  Quem somos
                </a>
              </li>
              <li>
                <a className="text-decoration-none" href="#" target="_blank">
                  Missão, visão e valores
                </a>
              </li>
              <li>
                <a className="text-decoration-none" href="#" target="_blank">
                  História
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 border-t-1 border-gray-600 pt-2">
          <div className="container">
            <div className="row">
              <div className="hy-pt-10 social-links col-12 text-center">
                <ul>
                  <li>
                    <a href="https://www.facebook.com/cead.up" target="_blank">
                      <i className="fa fa-facebook-f"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#" target="_blank">
                      <i className="fa fa-twitter"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#" target="_blank">
                      <i className="fa fa-pinterest"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#" target="_blank">
                      <i className="fa fa-linkedin"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#" target="_blank">
                      <i className="fa fa-instagram"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youtube.com/@ceadupm" target="_blank">
                      <i className="fa fa-youtube-play"></i>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-12 text-center">
                <div className="copyright-area">
                  <small>
                    Copyright © 2026 Designed by
                    <a href="https://www.cead.up.ac.mz"> www.cead.up.ac.mz</a>.
                    Todos os direitos reservados.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
