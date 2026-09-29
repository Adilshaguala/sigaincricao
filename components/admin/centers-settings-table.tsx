"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState, useTransition } from "react"
import {
  MapPin,
  PackageOpen,
  RotateCcw,
  Search,
  SquareArrowUpRight,
} from "lucide-react"

import {
  deactivateCenters,
  promoteResourceCenter,
} from "@/app/admin/(portal)/configuracoes/actions"
import { CatalogConfirm } from "@/components/admin/catalog-confirm"
import { CenterCreateForm } from "@/components/admin/catalog-forms"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
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

type Center = {
  id: string
  name: string
  location: string
  isMainCampus: boolean
  applications: number
  courses: number
}
const PAGE_SIZE = 50

function pages(page: number, total: number): Array<number | string> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 3) return [1, 2, 3, 4, "right", total]
  if (page >= total - 2)
    return [1, "left", total - 3, total - 2, total - 1, total]
  return [1, "left", page, "right", total]
}

export function CentersSettingsTable({ centers }: { centers: Center[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const [error, setError] = useState("")
  const main = centers.find((center) => center.isMainCampus)

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-MZ")
    return centers.filter(
      (center) =>
        !query ||
        [
          center.name,
          center.location,
          center.isMainCampus
            ? "principal campus principal"
            : "secundario secundário campus",
        ].some((value) => value.toLocaleLowerCase("pt-MZ").includes(query))
    )
  }, [centers, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const selectable = visible.filter((center) => !center.isMainCampus)
  const allSelected =
    selectable.length > 0 &&
    selectable.every((center) => selected.has(center.id))
  const someSelected = selectable.some((center) => selected.has(center.id))

  const onCreated = useCallback(() => {
    setDialogOpen(false)
    setDialogKey((value) => value + 1)
    router.refresh()
  }, [router])

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
      for (const center of selectable) {
        if (checked) next.add(center.id)
        else next.delete(center.id)
      }
      return next
    })
  }

  async function remove(ids: string[]) {
    const result = await deactivateCenters(ids)
    if (!result.success) {
      setError(result.message ?? "Não foi possível eliminar o centro.")
      return false
    }
    setError("")
    setSelected(new Set())
    startTransition(() => router.refresh())
    return true
  }

  function promote(id: string) {
    startTransition(async () => {
      await promoteResourceCenter(id)
      setSelected(new Set())
      router.refresh()
    })
  }

  return (
    <Card className="min-h-0 min-w-0 flex-1 gap-0 overflow-hidden rounded-none bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="shrink-0 px-0">
        <CardTitle>
          <h1 className="text-2xl font-bold">Centro de recursos</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 min-w-0 flex-1 gap-0 overflow-hidden px-0">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field className="mt-4 max-w-xl">
          <FieldLabel htmlFor="main-campus">Centro principal</FieldLabel>
          <NativeSelect
            id="main-campus"
            className="w-full"
            value={main?.id ?? ""}
            onChange={(event) => {
              if (event.target.value) promote(event.target.value)
            }}
            disabled={pending}
          >
            <NativeSelectOption value="">
              Seleccione o centro principal
            </NativeSelectOption>
            {centers.map((center) => (
              <NativeSelectOption key={center.id} value={center.id}>
                {center.name} · {center.location}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Quando seleccionado, este será o centro principal de recursos.
          </FieldDescription>
        </Field>
        <div className="mt-6 flex shrink-0 flex-col gap-2 lg:flex-row lg:flex-nowrap lg:items-center">
          <InputGroup className="min-w-0 lg:flex-1">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Pesquisar centros"
              placeholder="Procure por nome, localização ou categoria"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
                setSelected(new Set())
              }}
            />
          </InputGroup>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <CatalogConfirm
                label="Eliminar seleccionados"
                description={`Esta acção irá desactivar ${selected.size} centro(s).`}
                onConfirm={() => remove([...selected])}
                disabled={pending}
              />
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button type="button" />}>
                Adicionar
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Centro</DialogTitle>
                </DialogHeader>
                <CenterCreateForm key={dialogKey} onCreated={onCreated} />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="icon"
              aria-label="Actualizar lista"
              disabled={pending}
              onClick={() => startTransition(() => router.refresh())}
            >
              <RotateCcw />
            </Button>
          </div>
        </div>
        <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
          <Table
            className="min-w-160"
            containerClassName="min-h-0 flex-1 overflow-auto"
            aria-label="Tabela de centros de recursos"
          >
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Seleccionar centros desta página"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    disabled={!selectable.length}
                    onCheckedChange={(checked) => togglePage(checked === true)}
                  />
                </TableHead>
                <TableHead>Nome do centro</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>
                  <span className="sr-only">Acções</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((center) => (
                <TableRow
                  key={center.id}
                  data-state={selected.has(center.id) ? "selected" : undefined}
                  onDoubleClick={(event) => {
                    if (
                      !(event.target as HTMLElement).closest(
                        "button, a, [role=checkbox]"
                      )
                    )
                      router.push(`/admin/configuracoes/centros/${center.id}`)
                  }}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Seleccionar ${center.name}`}
                      checked={selected.has(center.id)}
                      disabled={center.isMainCampus}
                      onCheckedChange={(checked) =>
                        toggleRow(center.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/configuracoes/centros/${center.id}`}
                      className="hover:underline"
                    >
                      {center.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4" />
                      {center.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={center.isMainCampus ? "default" : "secondary"}
                    >
                      {center.isMainCampus ? "Principal" : "Secundário"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {!center.isMainCampus && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => promote(center.id)}
                        >
                          Promover
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Visualizar ${center.name}`}
                        render={
                          <Link
                            href={`/admin/configuracoes/centros/${center.id}`}
                          />
                        }
                        nativeButton={false}
                      >
                        <SquareArrowUpRight />
                      </Button>
                      {!center.isMainCampus && (
                        <CatalogConfirm
                          compact
                          label={`Eliminar ${center.name}`}
                          description={`O centro ${center.name} ficará inactivo e deixará de aparecer no formulário de candidatura.`}
                          onConfirm={() => remove([center.id])}
                          disabled={pending}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
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
