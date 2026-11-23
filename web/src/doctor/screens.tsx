import { errorText } from '@/reception/api'
import { PageTitle } from '@/shell/app-shell'
import { Kpi } from '@/shell/crm-dashboard-kit'
import { CalendarCheck, RefreshCw, Wallet } from 'lucide-react'
import {
  type Earnings,
  type ScheduleRow,
  money,
  mskToday,
  useEarnings,
  useSchedule,
} from './api'

const NOT_LINKED =
  'Вы ещё не привязаны к врачу в МИС — обратитесь к владельцу, он свяжет вас через «Привязка врачей к МИС».'

const TIME = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})
const DAY = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const MONTH = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const dayLabel = (day: string) => {
  const text = DAY.format(new Date(`${day}T00:00:00Z`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Отменённые приёмы сервер не отдаёт (решение владельца 13.11.2026)
const STATUS: Record<ScheduleRow['status'], string> = {
  planned: 'Записан',
  came: 'Пришёл',
}

/** Ошибка сервера — не «пусто»: МИС не ответила — так и пишем, с «Повторить». */
function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role='alert' className='load-failed'>
      <span>{errorText(error)}</span>
      <button type='button' className='button compact' onClick={onRetry}>
        Повторить
      </button>
    </div>
  )
}

function VisitsTable({
  rows,
  caption,
}: {
  rows: ScheduleRow[]
  caption: string
}) {
  return (
    <div
      className='table-wrap standard-table-wrap'
      role='region'
      aria-label={caption}
    >
      <table className='crm-fit doctor-table'>
        <caption className='skip'>{caption}</caption>
        <thead>
          <tr>
            <th>Время · МСК</th>
            <th>Пациент</th>
            <th>Услуга</th>
            <th>Формат</th>
            <th>Этап</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.visit_id}>
              <td>
                <time dateTime={r.starts_at}>
                  {TIME.format(new Date(r.starts_at))}
                </time>
              </td>
              <td>
                <strong>{r.patient_name ?? 'Без имени в МИС'}</strong>
              </td>
              <td data-label='Услуга'>{r.services.join(', ') || '—'}</td>
              <td data-label='Формат'>{r.online ? 'Онлайн' : 'В клинике'}</td>
              <td data-label='Этап'>
                {STATUS[r.status]}
                {r.unpaid && (
                  <small className='dashboard-row-meta text-danger'>
                    не оплачен
                  </small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DayPanel({ day, rows }: { day: string; rows: ScheduleRow[] }) {
  return (
    <section className='panel' aria-label={dayLabel(day)}>
      <div className='panel-head'>
        <div>
          <h2>{dayLabel(day)}</h2>
          <p>{rows.length === 0 ? 'Записей нет' : `Приёмов: ${rows.length}`}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className='empty'>На этот день записей нет.</p>
      ) : (
        <VisitsTable rows={rows} caption={`Приёмы — ${dayLabel(day)}`} />
      )}
    </section>
  )
}

function earningsOn(day: string, earnings: Earnings | undefined) {
  return earnings?.days.find((d) => d.date === day) ?? null
}

export function TodayScreen() {
  const today = mskToday()
  const schedule = useSchedule(today, today)
  const earnings = useEarnings()
  const came = (schedule.data?.rows ?? []).filter((r) => r.status === 'came')
  const planned = schedule.data?.rows ?? []
  const todayEarnings = earningsOn(today, earnings.data)
  return (
    <>
      <PageTitle
        title='Сегодня'
        actions={
          <button
            type='button'
            className='button compact'
            onClick={() => {
              void schedule.refetch()
              void earnings.refetch()
            }}
          >
            <RefreshCw className='icon' aria-hidden /> Обновить
          </button>
        }
      />
      {schedule.data?.linked === false ? (
        <p role='status' className='note'>
          {NOT_LINKED}
        </p>
      ) : (
        <>
          <div className='doctor-kpis'>
            <section className='panel doctor-kpi'>
              <Kpi
                title='Приёмов сегодня'
                icon={<CalendarCheck className='icon' aria-hidden />}
                value={schedule.data ? planned.length : null}
                missing={schedule.isError}
                note={schedule.data ? `Пришли: ${came.length}` : ''}
              />
            </section>
            <section className='panel doctor-kpi'>
              <Kpi
                title='Заработано сегодня'
                icon={<Wallet className='icon' aria-hidden />}
                value={todayEarnings ? Number(todayEarnings.payout) : null}
                missing={
                  earnings.isError ||
                  (earnings.data !== undefined && !todayEarnings)
                }
                format={money}
                note={
                  earnings.data?.rate_missing
                    ? 'Ставка не настроена — обратитесь к владельцу'
                    : 'По оплаченным приёмам; оплата позже придёт ночью'
                }
              />
            </section>
            <section className='panel doctor-kpi'>
              <Kpi
                title='За месяц'
                icon={<Wallet className='icon' aria-hidden />}
                value={
                  earnings.data?.summary
                    ? Number(earnings.data.summary.payout)
                    : null
                }
                missing={
                  earnings.isError ||
                  (earnings.data !== undefined && !earnings.data.summary)
                }
                format={money}
                note={
                  earnings.data?.summary
                    ? `Пациентов: ${earnings.data.summary.patients}`
                    : ''
                }
              />
            </section>
          </div>
          {schedule.isPending ? (
            <p className='note'>Загружаю расписание…</p>
          ) : schedule.isError ? (
            <Failed
              error={schedule.error}
              onRetry={() => void schedule.refetch()}
            />
          ) : (
            <DayPanel day={today} rows={schedule.data.rows} />
          )}
        </>
      )}
    </>
  )
}

/** Только текущий месяц, как «💰 Моя зарплата» в боте (решение владельца 13.11.2026). */
export function EarningsScreen() {
  const earnings = useEarnings()
  const title = MONTH.format(new Date(`${mskToday().slice(0, 7)}-01T00:00:00Z`))
  return (
    <>
      <PageTitle
        title='Заработок'
        subtitle={`${title.charAt(0).toUpperCase() + title.slice(1)}, по сегодня`}
        actions={
          <button
            type='button'
            className='button compact'
            onClick={() => void earnings.refetch()}
          >
            <RefreshCw className='icon' aria-hidden /> Обновить
          </button>
        }
      />
      {earnings.isPending ? (
        <p className='note'>Считаю…</p>
      ) : earnings.isError ? (
        <Failed
          error={earnings.error}
          onRetry={() => void earnings.refetch()}
        />
      ) : !earnings.data.linked ? (
        <p role='status' className='note'>
          {NOT_LINKED}
        </p>
      ) : (
        <>
          <div className='doctor-kpis'>
            <section className='panel doctor-kpi'>
              <Kpi
                title='Заработано за месяц'
                icon={<Wallet className='icon' aria-hidden />}
                value={
                  earnings.data.summary
                    ? Number(earnings.data.summary.payout)
                    : null
                }
                missing={!earnings.data.summary}
                format={money}
                note={
                  earnings.data.rate_missing
                    ? 'Ставка не настроена — обратитесь к владельцу'
                    : 'Те же цифры, что «💰 Моя зарплата» в боте'
                }
              />
            </section>
            <section className='panel doctor-kpi'>
              <Kpi
                title='Пациентов'
                icon={<CalendarCheck className='icon' aria-hidden />}
                value={
                  earnings.data.summary ? earnings.data.summary.patients : null
                }
                missing={!earnings.data.summary}
                note='Пришли на приём'
              />
            </section>
          </div>
          <section className='panel' aria-label='По дням'>
            <div className='panel-head'>
              <div>
                <h2>По дням</h2>
                <p>Деньги — дню приёма, не дню оплаты</p>
              </div>
            </div>
            {earnings.data.days.length === 0 ? (
              <p className='empty'>Нет данных за этот месяц.</p>
            ) : (
              <div
                className='table-wrap standard-table-wrap'
                role='region'
                aria-label='Заработок по дням'
              >
                <table className='crm-fit'>
                  <caption className='skip'>Заработок по дням</caption>
                  <thead>
                    <tr>
                      <th>День</th>
                      <th>Пациентов</th>
                      <th>Заработок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.data.days.map((d) => (
                      <tr key={d.date}>
                        <td>{dayLabel(d.date)}</td>
                        <td>{d.patients}</td>
                        <td>{money(d.payout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
