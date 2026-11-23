// Заглушка сервера окна врача: те же адреса и ответы, что у настоящего /api/doctor.
// Все данные выдуманные и собираются на лету от даты — одинаковые при каждом запуске.
import { PATIENTS, SERVICES } from './people.ts'

type Row = {
  visit_id: number
  starts_at: string
  ends_at: string | null
  patient_name: string | null
  services: string[]
  online: boolean
  status: 'planned' | 'came'
  unpaid: boolean
}

const MSK_TODAY = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(
    new Date()
  )

function* days(from: string, to: string) {
  const d = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  for (let i = 0; d <= end && i < 62; i++) {
    yield d.toISOString().slice(0, 10)
    d.setUTCDate(d.getUTCDate() + 1)
  }
}

/** Простое число от строки — чтобы день всегда выглядел одинаково. */
function seed(text: string): number {
  let h = 7
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 100_003
  return h
}

const pad = (n: number) => String(n).padStart(2, '0')

function dayRows(day: string, today: string): Row[] {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
  if (weekday === 0) return [] // воскресенье — врач не принимает
  const s = seed(day)
  const count = 2 + (s % 5) // от 2 до 6 приёмов
  const rows: Row[] = []
  for (let i = 0; i < count; i++) {
    const hour = 10 + i * 2 + (s % 2)
    if (hour > 20) break
    const service = SERVICES[(s + i) % SERVICES.length]
    const past = day < today
    rows.push({
      visit_id: Number(day.replace(/-/g, '').slice(2)) * 10 + i,
      starts_at: `${day}T${pad(hour)}:00:00+03:00`,
      ends_at: service.minutes
        ? `${day}T${pad(hour)}:${pad(service.minutes)}:00+03:00`
        : null,
      // у части записей в МИС нет имени — окно это показывает
      patient_name:
        (s + i) % 9 === 0 ? null : PATIENTS[(s + i) % PATIENTS.length],
      services: [service.name],
      online: service.online,
      status: past ? 'came' : 'planned',
      unpaid: past && (s + i) % 7 === 0,
    })
  }
  return rows
}

export function schedule(query: URLSearchParams) {
  const today = MSK_TODAY()
  const from = query.get('date_from') ?? today
  const to = query.get('date_to') ?? from
  return {
    linked: true,
    rows: [...days(from, to)].flatMap((d) => dayRows(d, today)),
  }
}

export function earnings() {
  const today = MSK_TODAY()
  const first = `${today.slice(0, 7)}-01`
  const list = [...days(first, today)]
    .map((date) => ({ date, rows: dayRows(date, '9999-12-31') }))
    .filter((d) => d.rows.length > 0)
    .map((d) => ({
      date: d.date,
      patients: d.rows.length,
      payout: (d.rows.length * 1750).toFixed(2),
    }))
  const patients = list.reduce((sum, d) => sum + d.patients, 0)
  return {
    linked: true,
    date_from: first,
    date_to: today,
    summary: list.length
      ? { patients, payout: (patients * 1750).toFixed(2) }
      : null,
    days: list,
    rate_missing: false,
  }
}

export const changes = () => ({ changed_at: null })
