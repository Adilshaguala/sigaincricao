import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type RecentApplicationRow = {
  id: string
  studentId: string
  name: string
  course: string
  center: string
  submittedAt: string
}

export function DataTable({ data }: { data: RecentApplicationRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrições recentes</CardTitle>
        <CardDescription>Últimas candidaturas submetidas</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/admin/estudantes" />}
            nativeButton={false}
          >
            Ver todas
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudante</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Submissão</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acções</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Button
                      variant="link"
                      render={
                        <Link href={`/admin/estudantes/${row.studentId}`} />
                      }
                      nativeButton={false}
                    >
                      {row.name}
                    </Button>
                  </TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.center}</TableCell>
                  <TableCell>{row.submittedAt}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Submetida</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ver dados de ${row.name}`}
                      render={
                        <Link href={`/admin/estudantes/${row.studentId}`} />
                      }
                      nativeButton={false}
                    >
                      <ArrowUpRight />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma inscrição submetida.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
