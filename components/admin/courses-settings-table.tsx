"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowUpDown,
  FunnelX,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  SquareArrowUpRight,
} from "lucide-react"

import { deactivateCourses } from "@/app/admin/(portal)/configuracoes/actions"
import { CatalogConfirm } from "@/components/admin/catalog-confirm"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
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

const PAGE_SIZE = 50
type Course = {
  id: string
  name: string
  plan: string | null
  duration: number | null
  levelId: string | null
  levelName: string | null
  centerIds: string[]
  centerNames: string[]
  applications: number
}
type Option = { id: string; name: string }
type SortKey = "name" | "plan" | "duration" | "levelName"

function pages(page: number, total: number): Array<number | string> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 3) return [1, 2, 3, 4, "right", total]
  if (page >= total - 2)
    return [1, "left", total - 3, total - 2, total - 1, total]
  return [1, "left", page, "right", total]
}

export function CoursesSettingsTable({
  courses,
  centers,
  levels,
}: {
  courses: Course[]
  centers: Option[]
  levels: Option[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [centerId, setCenterId] = useState("")
  const [plan, setPlan] = useState("")
  const [levelId, setLevelId] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [descending, setDescending] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState("")
  const plans = [
    ...new Set(
      courses
        .map((course) => course.plan)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort()

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-MZ")
    return courses
      .filter((course) => {
        if (centerId && !course.centerIds.includes(centerId)) return false
        if (plan && course.plan !== plan) return false
        if (levelId && course.levelId !== levelId) return false
        return (
          !query ||
          [
            course.name,
            course.plan ?? "",
            String(course.duration ?? ""),
            course.levelName ?? "",
            ...course.centerNames,
          ].some((value) => value.toLocaleLowerCase("pt-MZ").includes(query))
        )
      })
      .sort((a, b) => {
        const left = a[sortKey] ?? ""
        const right = b[sortKey] ?? ""
        const result =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right), "pt-MZ", {
                numeric: true,
              })
        return descending ? -result : result
      })
  }, [courses, search, centerId, plan, levelId, sortKey, descending])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const allSelected =
    visible.length > 0 && visible.every((course) => selected.has(course.id))
  const someSelected = visible.some((course) => selected.has(course.id))

  function changeFilter(update: () => void) {
    update()
    setPage(1)
    setSelected(new Set())
  }
  function sortBy(key: SortKey) {
    if (sortKey === key) setDescending((value) => !value)
    else {
      setSortKey(key)
      setDescending(false)
    }
    setPage(1)
  }
  function toggleRow(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  function togglePage(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      for (const course of visible) {
        if (checked) next.add(course.id)
        else next.delete(course.id)
      }
      return next
    })
  }

  async function remove(ids: string[]) {
    const result = await deactivateCourses(ids)
    if (!result.success) {
      setError(result.message ?? "Não foi possível eliminar o curso.")
      return false
    }
    setError("")
    setSelected(new Set())
    startTransition(() => router.refresh())
    return true
  }

  return (
    <Card className="min-h-0 min-w-0 flex-1 gap-0 overflow-hidden rounded-none bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="shrink-0 px-0">
        <CardTitle>
          <h1 className="text-2xl font-bold">Cursos</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 min-w-0 flex-1 gap-0 overflow-hidden px-0">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="mt-4 flex shrink-0 flex-col gap-2 xl:flex-row xl:flex-nowrap xl:items-end">
          <Field className="w-full min-w-0 xl:flex-1">
            <FieldLabel htmlFor="course-search">Pesquisa</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="course-search"
                type="search"
                placeholder="Procure por nome, plano, centro ou grau"
                value={search}
                onChange={(event) =>
                  changeFilter(() => setSearch(event.target.value))
                }
              />
            </InputGroup>
          </Field>
          <Field className="w-full xl:w-64">
            <FieldLabel htmlFor="course-center-filter">
              Centro de recursos
            </FieldLabel>
            <NativeSelect
              id="course-center-filter"
              className="w-full"
              value={centerId}
              onChange={(event) =>
                changeFilter(() => setCenterId(event.target.value))
              }
            >
              <NativeSelectOption value="">Todos</NativeSelectOption>
              {centers.map((center) => (
                <NativeSelectOption key={center.id} value={center.id}>
                  {center.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field className="w-full xl:w-45">
            <FieldLabel htmlFor="course-plan-filter">Plano</FieldLabel>
            <NativeSelect
              id="course-plan-filter"
              className="w-full"
              value={plan}
              onChange={(event) =>
                changeFilter(() => setPlan(event.target.value))
              }
            >
              <NativeSelectOption value="">Todos</NativeSelectOption>
              {plans.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field className="w-full xl:w-64">
            <FieldLabel htmlFor="course-level-filter">
              Grau académico
            </FieldLabel>
            <NativeSelect
              id="course-level-filter"
              className="w-full"
              value={levelId}
              onChange={(event) =>
                changeFilter(() => setLevelId(event.target.value))
              }
            >
              <NativeSelectOption value="">Todos</NativeSelectOption>
              {levels.map((level) => (
                <NativeSelectOption key={level.id} value={level.id}>
                  {level.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <CatalogConfirm
                label="Eliminar seleccionados"
                description={`Esta acção irá desactivar ${selected.size} curso(s).`}
                onConfirm={() => remove([...selected])}
                disabled={pending}
              />
            )}
            <Button
              render={<Link href="/admin/configuracoes/cursos/novo" />}
              nativeButton={false}
            >
              <Plus />
              Adicionar
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Actualizar lista"
              disabled={pending}
              onClick={() => startTransition(() => router.refresh())}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover filtros"
              onClick={() =>
                changeFilter(() => {
                  setSearch("")
                  setCenterId("")
                  setPlan("")
                  setLevelId("")
                })
              }
            >
              <FunnelX />
            </Button>
          </div>
        </div>
        <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
          <Table
            className="min-w-275"
            containerClassName="min-h-0 flex-1 overflow-auto"
            aria-label="Tabela de cursos"
          >
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Seleccionar cursos desta página"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    disabled={!visible.length}
                    onCheckedChange={(checked) => togglePage(checked === true)}
                  />
                </TableHead>
                {(
                  [
                    ["name", "Nome"],
                    ["plan", "Plano"],
                    ["duration", "Duração"],
                    ["levelName", "Grau académico"],
                  ] as const
                ).map(([key, label]) => (
                  <TableHead key={key}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sortBy(key)}
                      aria-label={`Ordenar por ${label}`}
                      aria-pressed={sortKey === key}
                    >
                      {label}
                      <ArrowUpDown />
                    </Button>
                  </TableHead>
                ))}
                <TableHead>Centro</TableHead>
                <TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((course) => (
                <TableRow
                  key={course.id}
                  data-state={selected.has(course.id) ? "selected" : undefined}
                  onDoubleClick={(event) => {
                    if (
                      !(event.target as HTMLElement).closest(
                        "button, a, [role=checkbox]"
                      )
                    )
                      router.push(`/admin/configuracoes/cursos/${course.id}`)
                  }}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Seleccionar ${course.name}`}
                      checked={selected.has(course.id)}
                      onCheckedChange={(checked) =>
                        toggleRow(course.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/configuracoes/cursos/${course.id}`}
                      className="hover:underline"
                    >
                      {course.name}
                    </Link>
                    {(!course.plan ||
                      !course.duration ||
                      !course.levelId ||
                      !course.centerIds.length) && (
                      <Badge variant="outline" className="ml-2">
                        Incompleto
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{course.plan ?? "—"}</TableCell>
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
                    <div className="flex flex-col items-start gap-2">
                      {course.centerNames.length
                        ? course.centerNames.map((name, index) => (
                            <Badge key={`${name}-${index}`} variant="secondary">
                              {name}
                            </Badge>
                          ))
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Visualizar ${course.name}`}
                        render={
                          <Link
                            href={`/admin/configuracoes/cursos/${course.id}`}
                          />
                        }
                        nativeButton={false}
                      >
                        <SquareArrowUpRight />
                      </Button>
                      <CatalogConfirm
                        compact
                        label={`Eliminar ${course.name}`}
                        description={`O curso ${course.name} ficará inactivo e deixará de aparecer no formulário de candidatura.`}
                        onConfirm={() => remove([course.id])}
                        disabled={pending}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <PackageOpen className="size-8 text-muted-foreground" />
                      <p>Nenhum item encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex shrink-0 flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
            <CardDescription aria-live="polite">
              {selected.size ? `${selected.size} seleccionados de ` : ""}
              {filtered.length} {filtered.length === 1 ? "item" : "itens"}
            </CardDescription>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Anterior"
                      aria-disabled={currentPage === 1}
                      onClick={(event) => {
                        event.preventDefault()
                        if (currentPage > 1) setPage(currentPage - 1)
                      }}
                    />
                  </PaginationItem>
                  {pages(currentPage, totalPages).map((value) => (
                    <PaginationItem key={value}>
                      {typeof value === "number" ? (
                        <PaginationLink
                          href="#"
                          isActive={value === currentPage}
                          onClick={(event) => {
                            event.preventDefault()
                            setPage(value)
                          }}
                        >
                          {value}
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
                      aria-disabled={currentPage === totalPages}
                      onClick={(event) => {
                        event.preventDefault()
                        if (currentPage < totalPages) setPage(currentPage + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
