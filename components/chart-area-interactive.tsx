"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, GraduationCap, MapPin, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Todas as cores vêm das variáveis --chart-* do tema shadcn (definidas em globals.css).
// Antes usava-se "var(--primary)", que é a cor de acção do tema e não a paleta dos gráficos.
const applicationsChartConfig = {
  count: { label: "Candidaturas", color: "var(--chart-1)" },
} satisfies ChartConfig

const genderChartConfig = {
  Masculino: { label: "Masculino", color: "var(--chart-1)" },
  Feminino: { label: "Feminino", color: "var(--chart-2)" },
  "Não indicado": { label: "Não indicado", color: "var(--chart-3)" },
} satisfies ChartConfig

const fallbackChartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const genderColors: Record<string, string> = {
  Masculino: "var(--chart-1)",
  Feminino: "var(--chart-2)",
  "Não indicado": "var(--chart-3)",
}

type CountDatum = { label: string; count: number }

function EmptyChartState({ children }: { children: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function ChartAreaInteractive({ data }: { data: CountDatum[] }) {
  const [period, setPeriod] = useState("6")
  const filtered = useMemo(() => data.slice(-Number(period)), [data, period])
  const total = filtered.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolução das candidaturas</CardTitle>
        <CardDescription>
          Submissões concluídas nos últimos {period} meses
        </CardDescription>
        <CardAction>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value ?? "6")}
          >
            <SelectTrigger size="sm" aria-label="Período do gráfico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Período</SelectLabel>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={applicationsChartConfig}
          className="aspect-auto h-64 w-full"
          aria-label="Candidaturas submetidas por mês"
        >
          <AreaChart
            accessibilityLayer
            data={filtered}
            margin={{ left: 0, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              width={35}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <defs>
              <linearGradient
                id="applications-fill"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#applications-fill)"
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <Badge variant="secondary" className="w-fit">
          <BarChart3 />
          {total.toLocaleString("pt-MZ")} no período
        </Badge>
      </CardContent>
    </Card>
  )
}

export function GenderDistributionChart({ data }: { data: CountDatum[] }) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill:
      genderColors[item.label] ??
      fallbackChartColors[index % fallbackChartColors.length],
  }))
  const total = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por género</CardTitle>
        <CardDescription>Perfil dos candidatos submetidos</CardDescription>
        <CardAction>
          <Badge variant="outline">
            <UsersRound />
            {total.toLocaleString("pt-MZ")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartData.length ? (
          <ChartContainer
            config={genderChartConfig}
            className="mx-auto aspect-square h-64 w-full max-w-72"
            aria-label="Distribuição das candidaturas por género"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={62}
                strokeWidth={5}
              >
                {chartData.map((item) => (
                  <Cell key={item.label} fill={item.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                      return null

                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-semibold"
                        >
                          {total.toLocaleString("pt-MZ")}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="label" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <EmptyChartState>
            Ainda não existem candidaturas submetidas.
          </EmptyChartState>
        )}
      </CardContent>
    </Card>
  )
}

/** Cursos mais procurados: gráfico de colunas (barras verticais). */
function CoursesColumnChart({ data }: { data: CountDatum[] }) {
  const visibleData = data.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cursos mais procurados</CardTitle>
        <CardDescription>Cursos com mais candidaturas submetidas</CardDescription>
        <CardAction>
          <Badge variant="outline">
            <GraduationCap />
            Top {visibleData.length || 5}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {visibleData.length ? (
          <ChartContainer
            config={applicationsChartConfig}
            className="aspect-auto h-64 w-full"
            aria-label="Cursos mais procurados"
          >
            <BarChart
              accessibilityLayer
              data={visibleData}
              margin={{ left: 0, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={(value: string) =>
                  value.length > 10 ? `${value.slice(0, 9)}…` : value
                }
              />
              <YAxis
                allowDecimals={false}
                width={35}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyChartState>
            Ainda não existem candidaturas submetidas.
          </EmptyChartState>
        )}
      </CardContent>
    </Card>
  )
}

/** Centros mais procurados: gráfico de pizza (rosca). */
function CentersPieChart({ data }: { data: CountDatum[] }) {
  const visibleData = data.slice(0, 5).map((item, index) => ({
    ...item,
    fill: fallbackChartColors[index % fallbackChartColors.length],
  }))
  const total = visibleData.reduce((sum, item) => sum + item.count, 0)

  // A configuração é gerada a partir dos dados, pois os centros são dinâmicos.
  const chartConfig = Object.fromEntries(
    visibleData.map((item) => [
      item.label,
      { label: item.label, color: item.fill },
    ])
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centros mais procurados</CardTitle>
        <CardDescription>
          Centros de recursos escolhidos pelos candidatos
        </CardDescription>
        <CardAction>
          <Badge variant="outline">
            <MapPin />
            Top {visibleData.length || 5}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {visibleData.length ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-64 w-full max-w-72"
            aria-label="Centros mais procurados"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={visibleData}
                dataKey="count"
                nameKey="label"
                strokeWidth={5}
              >
                {visibleData.map((item) => (
                  <Cell key={item.label} fill={item.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="label" />}
                className="flex-wrap gap-y-1"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <EmptyChartState>
            Ainda não existem candidaturas submetidas.
          </EmptyChartState>
        )}
        {total > 0 && (
          <Badge variant="secondary" className="mt-4 w-fit">
            <UsersRound />
            {total.toLocaleString("pt-MZ")} no Top {visibleData.length}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export function DistributionCharts({
  courseCounts,
  centerCounts,
}: {
  courseCounts: { name: string; count: number }[]
  centerCounts: { name: string; count: number }[]
}) {
  return (
    <section
      aria-label="Rankings das candidaturas"
      className="grid gap-6 @4xl/main:grid-cols-2"
    >
      <CoursesColumnChart
        data={courseCounts.map((item) => ({
          label: item.name,
          count: item.count,
        }))}
      />
      <CentersPieChart
        data={centerCounts.map((item) => ({
          label: item.name,
          count: item.count,
        }))}
      />
    </section>
  )
}