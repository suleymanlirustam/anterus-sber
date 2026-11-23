import { type CSSProperties, useState } from 'react'
import { errorText } from '@/reception/api'
import { PageTitle } from '@/shell/app-shell'
import { Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ScheduleRow, addDays, mskToday, useSchedule } from './api'

// Расписание календарём, как в SQNS (решение владельца 14.11.2026): «Неделя» — столбцы по
// дням, только дни с приёмами; «Месяц» — сетка календаря, нажал на день — он открывается
// столбцом. Цвета: пришёл — зелёная, записан — голубая, не оплачен — жёлтая полоска.

const NOT_LINKED =
  'Вы ещё не привязаны к врачу в МИС — обратитесь к владельцу, он свяжет вас через «Привязка врачей к МИС».'

const TIME = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})
const DAY = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const MONTH = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const at = (day: string) => new Date(`${day}T00:00:00Z`)
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const dayLabel = (day: string) => capital(DAY.format(at(day)))
const weekday = (day: string) => (at(day).getUTCDay() + 6) % 7 // пн = 0
const monday = (day: string) => addDays(day, -weekday(day))
const monthStart = (day: string) => `${day.slice(0, 7)}-01`
const monthEnd = (day: string) => {
  const d = at(monthStart(day))
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}
const shiftMonth = (day: string, by: number) => {
  const d = at(monthStart(day))
  d.setUTCMonth(d.getUTCMonth() + by)
  return d.toISOString().slice(0, 10)
}
const range = (from: string, to: string) => {
  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}
const surname = (name: string | null) => (name ?? 'Без имени').split(' ')[0]

function timeRange(r: ScheduleRow) {
  const start = TIME.format(new Date(r.starts_at))
  return r.ends_at ? `${start}–${TIME.format(new Date(r.ends_at))}` : start
}

function VisitCard({ r }: { r: ScheduleRow }) {
  return (
    <article
      className={cn(
        'doctor-visit',
        r.status === 'came' ? 'is-came' : 'is-planned',
        r.unpaid && 'is-unpaid'
      )}
      aria-label={`${timeRange(r)}, ${r.patient_name ?? 'без имени в МИС'}`}
    >
      <p className='doctor-visit-time'>
        <time dateTime={r.starts_at}>{timeRange(r)}</time>
        {r.online && (
          <span className='doctor-visit-online'>
            <Video className='icon' aria-hidden /> онлайн
          </span>
        )}
      </p>
      <strong>{r.patient_name ?? 'Без имени в МИС'}</strong>
      {r.services.length > 0 && <small>{r.services.join(', ')}</small>}
      <small className='doctor-visit-state'>
        {r.status === 'came' ? 'Пришёл' : 'Записан'}
        {r.unpaid && ' · не оплачен'}
      </small>
    </article>
  )
}

function DayColumn({ day, rows }: { day: string; rows: ScheduleRow[] }) {
  return (
    <section className='doctor-day' aria-label={dayLabel(day)}>
      <h2 className='doctor-day-head'>
        {dayLabel(day)}
        <span>Приёмов: {rows.length}</span>
      </h2>
      {rows.map((r) => (
        <VisitCard key={r.visit_id} r={r} />
      ))}
    </section>
  )
}

type Mode = 'week' | 'month'

export function ScheduleScreen() {
  const today = mskToday()
  const [mode, setMode] = useState<Mode>('week')
  const [anchor, setAnchor] = useState(today) // любой день показываемой недели или месяца
  const [opened, setOpened] = useState<string | null>(null) // день из сетки месяца
  const from = mode === 'week' ? monday(anchor) : monthStart(anchor)
  const to = mode === 'week' ? addDays(from, 6) : monthEnd(anchor)
  const schedule = useSchedule(from, to)
  const rows = schedule.data?.rows ?? []
  const byDay = (day: string) =>
    rows.filter((r) => mskToday(new Date(r.starts_at)) === day)
  const shift = (by: number) => {
    setOpened(null)
    setAnchor(
      mode === 'week' ? addDays(anchor, 7 * by) : shiftMonth(anchor, by)
    )
  }
  const choose = (next: Mode) => {
    setOpened(null)
    setMode(next)
  }
  const period =
    mode === 'week'
      ? `${dayLabel(from)} — ${dayLabel(to)}`
      : capital(MONTH.format(at(from)))
  const busyDays = range(from, to).filter((d) => byDay(d).length > 0)

  return (
    <>
      <PageTitle
        title='Расписание'
        subtitle={period}
        actions={
          <>
            <span role='group' aria-label='Вид' className='doctor-modes'>
              {(
                [
                  ['week', 'Неделя'],
                  ['month', 'Месяц'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type='button'
                  aria-pressed={mode === id}
                  className={cn('button compact', mode === id && 'primary')}
                  onClick={() => choose(id)}
                >
                  {label}
                </button>
              ))}
            </span>
            <button
              type='button'
              className='button compact'
              aria-label={mode === 'week' ? 'Неделя назад' : 'Месяц назад'}
              onClick={() => shift(-1)}
            >
              ←
            </button>
            <button
              type='button'
              className='button compact'
              onClick={() => {
                setOpened(null)
                setAnchor(today)
              }}
            >
              Сегодня
            </button>
            <button
              type='button'
              className='button compact'
              aria-label={mode === 'week' ? 'Неделя вперёд' : 'Месяц вперёд'}
              onClick={() => shift(1)}
            >
              →
            </button>
          </>
        }
      />
      {schedule.isPending ? (
        <p className='note'>Загружаю расписание…</p>
      ) : schedule.isError ? (
        <div role='alert' className='load-failed'>
          <span>{errorText(schedule.error)}</span>
          <button
            type='button'
            className='button compact'
            onClick={() => void schedule.refetch()}
          >
            Повторить
          </button>
        </div>
      ) : !schedule.data.linked ? (
        <p role='status' className='note'>
          {NOT_LINKED}
        </p>
      ) : mode === 'week' ? (
        busyDays.length === 0 ? (
          <p className='empty'>На этой неделе приёмов нет.</p>
        ) : (
          <div
            className='doctor-week'
            style={{ '--doctor-days': busyDays.length } as CSSProperties}
          >
            {busyDays.map((day) => (
              <DayColumn key={day} day={day} rows={byDay(day)} />
            ))}
          </div>
        )
      ) : (
        <>
          <div className='doctor-month' role='grid' aria-label={period}>
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                role='columnheader'
                className='doctor-month-weekday'
              >
                {w}
              </span>
            ))}
            {Array.from({ length: weekday(from) }, (_, i) => (
              <span key={`pad-${i}`} className='doctor-month-pad' aria-hidden />
            ))}
            {range(from, to).map((day) => {
              const dayRows = byDay(day)
              const busy = dayRows.length > 0
              return (
                <button
                  key={day}
                  type='button'
                  role='gridcell'
                  disabled={!busy}
                  aria-pressed={opened === day}
                  aria-label={`${dayLabel(day)}: ${busy ? `приёмов ${dayRows.length}` : 'приёмов нет'}`}
                  className={cn(
                    'doctor-month-day',
                    busy ? 'is-busy' : 'is-free',
                    day === today && 'is-today'
                  )}
                  onClick={() => setOpened(opened === day ? null : day)}
                >
                  <span className='doctor-month-number'>
                    {Number(day.slice(8))}
                  </span>
                  {dayRows.slice(0, 3).map((r) => (
                    <span
                      key={r.visit_id}
                      className={cn(
                        'doctor-month-line',
                        r.status === 'came' ? 'is-came' : 'is-planned'
                      )}
                    >
                      {TIME.format(new Date(r.starts_at))}{' '}
                      {surname(r.patient_name)}
                    </span>
                  ))}
                  {dayRows.length > 3 && (
                    <span className='doctor-month-more'>
                      ещё {dayRows.length - 3}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {opened && <DayColumn day={opened} rows={byDay(opened)} />}
        </>
      )}
      <p className='note'>
        Отмена, перенос и отметка о приходе — в МИС, через администраторов.
      </p>
    </>
  )
}
