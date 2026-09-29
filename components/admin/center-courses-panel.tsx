"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { ArrowUpRight, PackageOpen, Plus, Search, Trash2 } from "lucide-react"

import { addCoursesToCenter } from "@/app/admin/(portal)/configuracoes/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Course = {
  id: string
  name: string
  plan: string | null
  duration: number | null
  levelName: string | null
}

export function CenterCoursesPanel({
  centerId,
  courses,
  allCourses,
}: {
  centerId: string
  courses: Course[]
  allCourses: Course[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState("")
  const available = allCourses.filter(
    (course) => !courses.some((associated) => associated.id === course.id)
  )
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-MZ")
    return courses.filter(
      (course) =>
        !query ||
        [
          course.name,
          course.plan ?? "",
          String(course.duration ?? ""),
          course.levelName ?? "",
        ].some((value) => value.toLocaleLowerCase("pt-MZ").includes(query))
    )
  }, [courses, search])

  function submit() {
    if (!selected.length) {
      setError("Seleccione pelo menos um curso.")
      return
    }
    startTransition(async () => {
      const result = await addCoursesToCenter(centerId, selected)
      if (!result.success) {
        setError(result.message ?? "Não foi possível associar os cursos.")
        return
      }
      setError("")
      setSelected([])
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Pesquisar cursos deste centro"
            placeholder="Procure por nome, plano, duração ou grau"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button type="button" disabled={!available.length} />}
          >
            <Plus />
            Adicionar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar curso</DialogTitle>
              <DialogDescription>
                Associe cursos existentes a este centro de recursos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="center-course-select">Cursos</FieldLabel>
                {selected.map((id) => {
                  const course = available.find((item) => item.id === id)
                  return (
                    <div key={id} className="flex gap-2">
                      <Input
                        readOnly
                        value={
                          course
                            ? `${course.name} · Plano ${course.plan ?? "—"}`
                            : id
                        }
                        aria-label="Curso seleccionado"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remover ${course?.name ?? "curso"}`}
                        onClick={() =>
                          setSelected((current) =>
                            current.filter((item) => item !== id)
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )
                })}
                {selected.length < available.length && (
                  <NativeSelect
                    id="center-course-select"
                    className="w-full"
                    value=""
                    onChange={(event) => {
                      if (event.target.value)
                        setSelected((current) => [
                          ...current,
                          event.target.value,
                        ])
                    }}
                  >
                    <NativeSelectOption value="">
                      Seleccione um curso
                    </NativeSelectOption>
                    {available
                      .filter((course) => !selected.includes(course.id))
                      .map((course) => (
                        <NativeSelectOption key={course.id} value={course.id}>
                          {course.name} · Plano {course.plan ?? "—"}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                )}
              </Field>
              <Button
                type="button"
                onClick={submit}
                disabled={pending || !selected.length}
              >
                {pending ? "A adicionar..." : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table className="mt-5 min-w-140" aria-label="Cursos deste centro">
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Grau académico</TableHead>
            <TableHead>
              <span className="sr-only">Abrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((course) => (
            <TableRow
              key={course.id}
              onDoubleClick={(event) => {
                if (!(event.target as HTMLElement).closest("a, button"))
                  router.push(`/admin/configuracoes/cursos/${course.id}`)
              }}
            >
              <TableCell>
                <Link
                  href={`/admin/configuracoes/cursos/${course.id}`}
                  className="hover:underline"
                >
                  {course.name} · Plano {course.plan ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                {course.duration ? `${course.duration} anos` : "—"}
              </TableCell>
              <TableCell>
                {course.levelName ? (
                  <Badge variant="secondary">{course.levelName}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Abrir ${course.name}`}
                  render={
                    <Link href={`/admin/configuracoes/cursos/${course.id}`} />
                  }
                  nativeButton={false}
                >
                  <ArrowUpRight />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!filtered.length && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center">
                <div className="flex flex-col items-center gap-2">
                  <PackageOpen className="size-8 text-muted-foreground" />
                  <p>Nenhum item encontrado.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
