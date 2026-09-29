"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowUpRight,
  Download,
  RotateCcw,
  Search,
  UsersRound,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ITEMS_PER_PAGE = 50

type Student = {
  id: string
  fullName: string
  idNumber: string
  phone: string
  email: string | null
  course: { id: string; name: string; shortName: string }
  resourceCenter: { id: string; name: string; location: string }
  submittedAt: string
}

type Props = {
  students: Student[]
  courses: { id: string; name: string; shortName: string }[]
  centers: { id: string; name: string; location: string }[]
}

function visiblePages(
  page: number,
  total: number
): Array<number | "left" | "right"> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (page <= 3) return [1, 2, 3, 4, "right", total]
  if (page >= total - 2)
    return [1, "left", total - 3, total - 2, total - 1, total]
  return [1, "left", page, "right", total]
}

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-MZ")
}

const dateFormatter = new Intl.DateTimeFormat("pt-MZ", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Maputo",
})

export function StudentsTable({ students, courses, centers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [courseId, setCourseId] = useState("")
  const [centerId, setCenterId] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const filtered = useMemo(() => {
    const query = normalize(search.trim())
    return students.filter((student) => {
      if (courseId && student.course.id !== courseId) return false
      if (centerId && student.resourceCenter.id !== centerId) return false
      if (!query) return true
      return [
        student.fullName,
        student.idNumber,
        student.phone,
        student.email ?? "",
        student.course.name,
        student.course.shortName,
        student.resourceCenter.name,
        student.resourceCenter.location,
      ].some((value) => normalize(value).includes(query))
    })
  }, [students, search, courseId, centerId])

  const pageCount = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const allVisibleSelected =
    visible.length > 0 && visible.every((student) => selected.has(student.id))
  const someVisibleSelected = visible.some((student) =>
    selected.has(student.id)
  )

  function changeFilter(change: () => void) {
    change()
    setPage(1)
    setSelected(new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleVisible(checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous)
      for (const student of visible) {
        if (checked) next.add(student.id)
        else next.delete(student.id)
      }
      return next
    })
  }

  const exportParams = new URLSearchParams()
  if (search.trim()) exportParams.set("q", search.trim())
  if (courseId) exportParams.set("courseId", courseId)
  if (centerId) exportParams.set("centerId", centerId)
  const exportHref = `/admin/estudantes/exportar${exportParams.size ? `?${exportParams}` : ""}`

  return (
    <div className="flex-1">
      <h1 className="text-2xl font-semibold mb-4">Estudantes inscritos</h1>
      <Card className="min-w-0">

        <CardContent className="min-w-0 gap-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <InputGroup className="min-w-0 lg:flex-1">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Pesquisar estudantes"
                placeholder="Nome, documento, contacto, curso ou centro"
                value={search}
                onChange={(event) =>
                  changeFilter(() => setSearch(event.target.value))
                }
              />
            </InputGroup>
            <div className="grid gap-2 sm:grid-cols-2 lg:flex">
              <NativeSelect
                className="w-full lg:w-52"
                aria-label="Filtrar por curso"
                value={courseId}
                onChange={(event) =>
                  changeFilter(() => setCourseId(event.target.value))
                }
              >
                <NativeSelectOption value="">Todos os cursos</NativeSelectOption>
                {courses.map((course) => (
                  <NativeSelectOption key={course.id} value={course.id}>
                    {course.shortName} · {course.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                className="w-full lg:w-52"
                aria-label="Filtrar por centro"
                value={centerId}
                onChange={(event) =>
                  changeFilter(() => setCenterId(event.target.value))
                }
              >
                <NativeSelectOption value="">Todos os centros</NativeSelectOption>
                {centers.map((center) => (
                  <NativeSelectOption key={center.id} value={center.id}>
                    {center.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex gap-2">
              {selected.size ? (
                <form
                  method="post"
                  action="/admin/estudantes/exportar"
                  className="flex-1 lg:flex-none"
                >
                  {[...selected].map((id) => (
                    <input key={id} type="hidden" name="id" value={id} />
                  ))}
                  <Button type="submit" className="w-full">
                    <Download />
                    Exportar {selected.size}{" "}
                    {selected.size === 1 ? "seleccionado" : "seleccionados"}
                  </Button>
                </form>
              ) : (
                <Button
                  className="flex-1 lg:flex-none"
                  render={<Link href={exportHref} prefetch={false} download />}
                  nativeButton={false}
                >
                  <Download />
                  Exportar Excel
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                aria-label="Actualizar lista"
                disabled={isPending}
                onClick={() => {
                  setSelected(new Set())
                  startTransition(() => router.refresh())
                }}
              >
                <RotateCcw />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  changeFilter(() => {
                    setSearch("")
                    setCourseId("")
                    setCenterId("")
                  })
                }
              >
                
                Limpar filtros
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <Table
              className="min-w-200"
              aria-label="Tabela de estudantes inscritos"
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Seleccionar estudantes desta página"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected && !allVisibleSelected}
                      disabled={!visible.length}
                      onCheckedChange={(checked) =>
                        toggleVisible(checked === true)
                      }
                    />
                  </TableHead>
                  <TableHead>Estudante</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Submissão</TableHead>
                  <TableHead>
                    <span className="sr-only">Abrir</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((student) => {
                  const initials = student.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                  return (
                    <TableRow
                      key={student.id}
                      data-state={
                        selected.has(student.id) ? "selected" : undefined
                      }
                      onDoubleClick={(event) => {
                        if (
                          !(event.target as HTMLElement).closest(
                            "button, a, [role=checkbox]"
                          )
                        )
                          router.push(`/admin/estudantes/${student.id}`)
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Seleccionar ${student.fullName}`}
                          checked={selected.has(student.id)}
                          onCheckedChange={(checked) =>
                            toggleOne(student.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium">{student.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              Documento {student.idNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{student.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.email || "Sem e-mail"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.course.shortName}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.resourceCenter.name}</TableCell>
                      <TableCell>
                        {dateFormatter.format(new Date(student.submittedAt))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Abrir dados de ${student.fullName}`}
                          render={
                            <Link href={`/admin/estudantes/${student.id}`} />
                          }
                          nativeButton={false}
                        >
                          <ArrowUpRight />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UsersRound
                          className="size-8 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <p className="font-medium">Nenhum estudante encontrado</p>
                        <p className="text-sm text-muted-foreground">
                          {search || courseId || centerId
                            ? "Tente alterar a pesquisa ou os filtros."
                            : "Ainda não existem candidaturas submetidas."}
                        </p>
                        {(search || courseId || centerId) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              changeFilter(() => {
                                setSearch("")
                                setCourseId("")
                                setCenterId("")
                              })
                            }
                          >
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-between">
          <CardDescription aria-live="polite">
            {selected.size ? `${selected.size} seleccionados de ` : ""}
            {filtered.length} {filtered.length === 1 ? "estudante" : "estudantes"}
            {filtered.length !== students.length
              ? ` · ${students.length} no total`
              : ""}
          </CardDescription>
          {pageCount > 1 && (
            <Pagination className="mx-0 w-auto sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text="Anterior"
                    aria-label="Página anterior"
                    aria-disabled={currentPage === 1}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage > 1) setPage(currentPage - 1)
                    }}
                  />
                </PaginationItem>
                {visiblePages(currentPage, pageCount).map((item) => (
                  <PaginationItem key={item}>
                    {typeof item === "number" ? (
                      <PaginationLink
                        href="#"
                        isActive={item === currentPage}
                        aria-label={`Página ${item}`}
                        onClick={(event) => {
                          event.preventDefault()
                          setPage(item)
                        }}
                      >
                        {item}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text="Seguinte"
                    aria-label="Página seguinte"
                    aria-disabled={currentPage === pageCount}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage < pageCount) setPage(currentPage + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
