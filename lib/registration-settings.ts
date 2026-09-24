import "server-only"

import { prisma } from "@/lib/prisma"

export const SETTINGS_ID = "default"
export const REGISTRATION_TIME_ZONE = "Africa/Maputo"

export type RegistrationState = "open" | "upcoming" | "closed"

export type RegistrationPeriod = {
  state: RegistrationState
  start: Date | null
  end: Date | null
  message: string
}

const dateFormatter = new Intl.DateTimeFormat("pt-MZ", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: REGISTRATION_TIME_ZONE,
})

export function formatRegistrationDate(date: Date) {
  return dateFormatter.format(date)
}

export function toDateTimeLocal(date: Date | null) {
  if (!date) return ""

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: REGISTRATION_TIME_ZONE,
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`
}

export function parseMaputoDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null

  const date = new Date(`${value}:00+02:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function getRegistrationPeriod(now = new Date()): Promise<RegistrationPeriod> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } })
  const start = settings?.registrationStart ?? null
  const end = settings?.registrationEnd ?? null

  if (start && now < start) {
    return {
      state: "upcoming",
      start,
      end,
      message: `As inscrições abrem em ${formatRegistrationDate(start)}.`,
    }
  }

  if (end && now > end) {
    return {
      state: "closed",
      start,
      end,
      message: `O prazo de inscrições terminou em ${formatRegistrationDate(end)}.`,
    }
  }

  return {
    state: "open",
    start,
    end,
    message: end
      ? `As inscrições estão abertas até ${formatRegistrationDate(end)}.`
      : "As inscrições estão abertas.",
  }
}
