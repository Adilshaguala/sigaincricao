"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const chartConfig = {
  count: { label: "Inscrições", color: "var(--primary)" },
} satisfies ChartConfig

export function ChartAreaInteractive({
  data,
}: {
  data: { label: string; count: number }[]
}) {
  const [period, setPeriod] = useState("6")
  const filtered = data.slice(-Number(period))
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolução das inscrições</CardTitle>
        <CardDescription>Submissões concluídas por mês</CardDescription>
        <CardAction>
          <NativeSelect
            aria-label="Período do gráfico"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <NativeSelectOption value="6">6 meses</NativeSelectOption>
            <NativeSelectOption value="3">3 meses</NativeSelectOption>
          </NativeSelect>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
          aria-label="Inscrições submetidas por mês"
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
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="count"
              type="monotone"
              fill="var(--color-count)"
              fillOpacity={0.2}
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function DistributionCharts({
  courseCounts,
  centerCounts,
  genderCounts,
}: {
  courseCounts: { name: string; count: number }[]
  centerCounts: { name: string; count: number }[]
  genderCounts: { label: string; count: number }[]
}) {
  const groups = [
    {
      value: "courses",
      title: "Cursos",
      data: courseCounts.map((item) => ({
        label: item.name,
        count: item.count,
      })),
    },
    {
      value: "centers",
      title: "Centros",
      data: centerCounts.map((item) => ({
        label: item.name,
        count: item.count,
      })),
    },
    { value: "gender", title: "Género", data: genderCounts },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição das inscrições</CardTitle>
        <CardDescription>
          Inscrições submetidas por curso, centro e género
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="courses">
          <TabsList aria-label="Distribuição das inscrições" className="">
            {groups.map((group) => (
              <TabsTrigger key={group.value} value={group.value}>
                {group.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((group) => (
            <TabsContent key={group.value} value={group.value}>
              {group.data.length ? (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-64 w-full"
                  aria-label={`Distribuição por ${group.title.toLowerCase()}`}
                >
                  <BarChart
                    accessibilityLayer
                    data={group.data}
                    layout="vertical"
                    margin={{ right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) =>
                        value.length > 18 ? value.slice(0, 17) + "…" : value
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <CardDescription className="py-12 text-center">
                  Ainda não existem inscrições submetidas.
                </CardDescription>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
