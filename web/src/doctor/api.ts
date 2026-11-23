import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Окно врача (план 13.11.2026) — только под /api/doctor; вход — та же кука, что у всех окон.
export const doctor = axios.create({ baseURL: '/api/doctor' })

export type VisitStatus = 'planned' | 'came' // отменённые сервер не отдаёт

export type ScheduleRow = {
  visit_id: number
  starts_at: string // ISO с зоной МСК
  ends_at: string | null // по прайсу; нет длительности — null
  patient_name: string | null // показать и забыть: в браузер не сохраняется
  services: string[]
  online: boolean
  status: VisitStatus
  unpaid: boolean
}

export type Schedule = { linked: boolean; rows: ScheduleRow[] }

export type EarningsDay = { date: string; patients: number; payout: string }

export type Earnings = {
  linked: boolean
  date_from?: string
  date_to?: string
  summary: { patients: number; payout: string } | null
  days: EarningsDay[]
  rate_missing: boolean
}

export const SCHEDULE = ['doctor', 'schedule'] as const
const CHANGES_EVERY_MS = 30_000

/** Сегодня по Москве — YYYY-MM-DD. */
export function mskToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(
    now
  )
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function useSchedule(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [...SCHEDULE, dateFrom, dateTo],
    queryFn: async () =>
      (
        await doctor.get<Schedule>('/schedule', {
          params: { date_from: dateFrom, date_to: dateTo },
        })
      ).data,
    // ФИО — только в памяти открытой страницы: не держим кэш дольше, чем экран открыт
    gcTime: 0,
    staleTime: 60_000,
  })
}

/** Заработок за текущий месяц по сегодня — как в боте. */
export function useEarnings() {
  return useQuery({
    queryKey: ['doctor', 'earnings'],
    queryFn: async () => (await doctor.get<Earnings>('/earnings')).data,
    staleTime: 5 * 60_000,
  })
}

/** Раз в 30 с спрашивает сервер, были ли изменения записи у врача (вебхуки SQNS); если время
 *  изменения новее — расписание берётся из МИС заново, страницу обновлять не нужно. */
export function useLiveSchedule() {
  const queryClient = useQueryClient()
  const changes = useQuery({
    queryKey: ['doctor', 'changes'],
    queryFn: async () =>
      (await doctor.get<{ changed_at: string | null }>('/changes')).data,
    refetchInterval: CHANGES_EVERY_MS,
    meta: { silent: true },
  })
  const seen = useRef<string | null | undefined>(undefined)
  const changedAt = changes.data?.changed_at
  useEffect(() => {
    if (changedAt === undefined) return
    if (seen.current !== undefined && changedAt !== seen.current)
      void queryClient.invalidateQueries({ queryKey: SCHEDULE })
    seen.current = changedAt
  }, [changedAt, queryClient])
}

const MONEY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function money(value: string | number): string {
  return `${MONEY.format(Number(value))} ₽`
}
