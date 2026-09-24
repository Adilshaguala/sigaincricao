import ExcelJS from "exceljs"
import type { NextRequest } from "next/server"
import { redirect } from "next/navigation"

import { getCurrentAdmin } from "@/lib/admin-auth"
import { getStudentsForExport } from "@/lib/admin-data"

export const runtime = "nodejs"

const HEADER_FILL = "FF0F172A"
const ACCENT_FILL = "FF047857"
const LIGHT_FILL = "FFF1F5F9"

export async function GET(request: NextRequest) {
  const administrator = await getCurrentAdmin()
  if (!administrator) redirect("/admin")

  const query = request.nextUrl.searchParams.get("q") ?? ""
  const courseId = request.nextUrl.searchParams.get("courseId") ?? ""
  const data = await getStudentsForExport({ query, courseId })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "SIGA — Sistema de Gestão de Inscrições"
  workbook.created = new Date()
  workbook.modified = new Date()

  const summary = workbook.addWorksheet("Resumo", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 21 },
  })
  summary.columns = [{ width: 28 }, { width: 48 }]
  summary.mergeCells("A1:B1")
  summary.getCell("A1").value = "RELATÓRIO DE ESTUDANTES INSCRITOS"
  summary.getCell("A1").font = { bold: true, color: { argb: "FFFFFFFF" }, size: 15 }
  summary.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_FILL } }
  summary.getCell("A1").alignment = { vertical: "middle", horizontal: "left" }
  summary.getRow(1).height = 34

  const summaryRows = [
    ["Total de estudantes", data.students.length],
    ["Curso", data.courseName],
    ["Pesquisa aplicada", data.query || "Nenhuma"],
    ["Exportado por", administrator.name],
    ["Data de exportação", new Date()],
  ]

  summary.addRows(summaryRows)
  summary.getColumn(1).font = { bold: true, color: { argb: "FF475569" } }
  summary.getCell("B6").numFmt = "dd/mm/yyyy hh:mm"
  summary.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_FILL } }
    }
  })

  const worksheet = workbook.addWorksheet("Estudantes inscritos", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  })

  worksheet.columns = [
    { header: "N.º", key: "number", width: 8 },
    { header: "Nome completo", key: "fullName", width: 34 },
    { header: "Documento", key: "idNumber", width: 20 },
    { header: "Data de nascimento", key: "birthDate", width: 20 },
    { header: "Género", key: "gender", width: 14 },
    { header: "Nacionalidade", key: "nationality", width: 18 },
    { header: "Telefone", key: "phone", width: 17 },
    { header: "E-mail", key: "email", width: 30 },
    { header: "Província", key: "province", width: 20 },
    { header: "Distrito", key: "district", width: 20 },
    { header: "Escola ou instituição", key: "school", width: 36 },
    { header: "Nível académico", key: "academicLevel", width: 23 },
    { header: "Área de formação", key: "trainingArea", width: 28 },
    { header: "Grupo", key: "academicGroup", width: 12 },
    { header: "Curso anterior", key: "educationCourse", width: 34 },
    { header: "Curso pretendido", key: "course", width: 42 },
    { header: "Sigla", key: "courseShortName", width: 12 },
    { header: "Centro de recursos", key: "center", width: 36 },
    { header: "Localização", key: "centerLocation", width: 22 },
    { header: "Data de submissão", key: "submittedAt", width: 21 },
    { header: "Estado", key: "status", width: 16 },
  ]

  data.students.forEach((student, index) => {
    if (!student.application) return

    worksheet.addRow({
      number: index + 1,
      fullName: student.fullName,
      idNumber: student.idNumber,
      birthDate: student.birthDate,
      gender: student.gender,
      nationality: student.nationality,
      phone: student.phone,
      email: student.email ?? "",
      province: student.province,
      district: student.district,
      school: student.school ?? "",
      academicLevel: student.academicLevel ?? "",
      trainingArea: student.trainingArea ?? "",
      academicGroup: student.academicGroup ?? "",
      educationCourse: student.educationCourse ?? "",
      course: student.application.course.name,
      courseShortName: student.application.course.shortName,
      center: student.application.resourceCenter.name,
      centerLocation: student.application.resourceCenter.location,
      submittedAt: student.application.submittedAt,
      status: "Submetida",
    })
  })

  const header = worksheet.getRow(1)
  header.height = 30
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
  header.alignment = { vertical: "middle", horizontal: "center" }

  worksheet.autoFilter = { from: "A1", to: "U1" }
  worksheet.getColumn("birthDate").numFmt = "dd/mm/yyyy"
  worksheet.getColumn("submittedAt").numFmt = "dd/mm/yyyy hh:mm"
  worksheet.getColumn("number").alignment = { horizontal: "center" }
  worksheet.getColumn("status").alignment = { horizontal: "center" }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle" }
      if (rowNumber % 2 === 0) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      }
      row.eachCell((cell) => {
        cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } }
      })
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="estudantes-inscritos-${date}.xlsx"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  })
}
