import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/reception/reception.css'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { type Earnings, type Schedule, doctor, mskToday } from './api'
import { DoctorShell } from './shell'

// Данные синтетические.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const today = mskToday()

const SCHEDULE: Schedule = {
  linked: true,
  rows: [
    {
      visit_id: 1,
      starts_at: `${today}T10:00:00+03:00`,
      ends_at: `${today}T10:50:00+03:00`,
      patient_name: 'Синтетикова Анна Тестовна',
      services: ['Консультация психиатра'],
      online: false,
      status: 'came',
      unpaid: true,
    },
    {
      visit_id: 2,
      starts_at: `${today}T11:00:00+03:00`,
      ends_at: null,
      patient_name: null,
      services: [],
      online: true,
      status: 'planned',
      unpaid: false,
    },
  ],
}

const EARNINGS: Earnings = {
  linked: true,
  summary: { patients: 7, payout: '24500.00' },
  days: [{ date: today, patients: 1, payout: '1200.00' }],
  rate_missing: false,
}

type Answers = {
  schedule?: Schedule | Error
  earnings?: Earnings | Error
  changes?: string | null
}

function mockServer(answers: Answers) {
  return vi.spyOn(doctor, 'get').mockImplementation(async (url: string) => {
    const pick = (value: unknown) => {
      if (value instanceof Error) throw value
      return { data: value }
    }
    if (url === '/schedule') return pick(answers.schedule ?? SCHEDULE)
    if (url === '/earnings') return pick(answers.earnings ?? EARNINGS)
    return pick({ changed_at: answers.changes ?? null })
  })
}

const renderShell = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DoctorShell me={{ id: 'u1', full_name: 'Тестов Врач Синтетович' }} />
    </QueryClientProvider>
  )

it('«Сегодня»: приёмы с ФИО, формат, «не оплачен» и заработок', async () => {
  await page.viewport(1440, 900)
  mockServer({})
  const screen = await renderShell()
  expect(document.title).toBe('Окно врача')
  await expect
    .element(screen.getByText('Синтетикова Анна Тестовна'))
    .toBeVisible()
  await expect.element(screen.getByText('не оплачен')).toBeVisible()
  await expect.element(screen.getByText('Онлайн')).toBeVisible()
  await expect.element(screen.getByText('В клинике')).toBeVisible()
  await expect.element(screen.getByText('Без имени в МИС')).toBeVisible()
  // отменённые сервер не отдаёт — считаются все строки
  await expect.element(screen.getByText('Приёмов: 2')).toBeVisible()
  await expect.element(screen.getByText('Пришли: 1')).toBeVisible()
  await expect.element(screen.getByText('1 200 ₽')).toBeVisible()
  await expect.element(screen.getByText('24 500 ₽')).toBeVisible()
})

it('МИС не ответила — сообщение и «Повторить», а не пустой день', async () => {
  mockServer({
    schedule: Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: {
        status: 503,
        data: {
          detail:
            'МИС сейчас не отвечает — нет данных. Попробуйте обновить позже.',
        },
      },
    }),
  })
  const screen = await renderShell()
  await expect.element(screen.getByRole('alert')).toBeVisible()
  await expect
    .element(screen.getByRole('button', { name: 'Повторить' }))
    .toBeVisible()
  expect(screen.container.textContent).not.toContain('На этот день записей нет')
})

it('нет привязки к МИС — понятная подсказка', async () => {
  mockServer({ schedule: { linked: false, rows: [] } })
  const screen = await renderShell()
  await expect
    .element(screen.getByText(/не привязаны к врачу в МИС/))
    .toBeVisible()
})

it('«Заработок»: нет пациентов за месяц — «нет данных», не 0', async () => {
  mockServer({
    earnings: { linked: true, summary: null, days: [], rate_missing: false },
  })
  const screen = await renderShell()
  await userEvent.click(screen.getByRole('button', { name: 'Заработок' }))
  await expect
    .element(screen.getByRole('heading', { name: 'Заработок' }))
    .toBeVisible()
  await expect
    .element(screen.getByText('Нет данных за этот месяц.'))
    .toBeVisible()
  expect(screen.container.textContent).not.toContain('0 ₽')
})

it('«Расписание»: неделя — только дни с приёмами, карточки с концом приёма', async () => {
  await page.viewport(1440, 900)
  const get = mockServer({})
  const screen = await renderShell()
  await userEvent.click(screen.getByRole('button', { name: 'Расписание' }))
  await expect
    .element(screen.getByRole('heading', { name: 'Расписание' }))
    .toBeVisible()
  await expect.element(screen.getByText('10:00–10:50')).toBeVisible()
  await expect.element(screen.getByText('11:00', { exact: true })).toBeVisible()
  await expect.element(screen.getByText('Пришёл · не оплачен')).toBeVisible()
  // столбец только у сегодняшнего дня — пустых дней недели нет
  expect(document.querySelectorAll('.doctor-day')).toHaveLength(1)
  await userEvent.click(screen.getByRole('button', { name: 'Неделя вперёд' }))
  await vi.waitFor(() =>
    expect(get).toHaveBeenCalledWith('/schedule', {
      params: expect.objectContaining({
        date_from: expect.not.stringMatching(today),
      }),
    })
  )
})

it('«Расписание»: месяц сеткой, нажал на день — открылся столбцом', async () => {
  await page.viewport(1440, 900)
  const get = mockServer({})
  const screen = await renderShell()
  await userEvent.click(screen.getByRole('button', { name: 'Расписание' }))
  await userEvent.click(screen.getByRole('button', { name: 'Месяц' }))
  await vi.waitFor(() =>
    expect(get).toHaveBeenCalledWith('/schedule', {
      params: {
        date_from: `${today.slice(0, 7)}-01`,
        date_to: expect.any(String),
      },
    })
  )
  expect(document.querySelectorAll('.doctor-day')).toHaveLength(0)
  const busy = document.querySelector<HTMLButtonElement>(
    '.doctor-month-day.is-busy'
  )!
  expect(busy.textContent).toContain('Синтетикова') // фамилия в клетке
  expect(document.querySelectorAll('.doctor-month-day.is-busy')).toHaveLength(1)
  await userEvent.click(busy)
  await expect
    .element(screen.getByText('Синтетикова Анна Тестовна'))
    .toBeVisible()
  expect(document.querySelectorAll('.doctor-day')).toHaveLength(1)
})

it('вебхук сообщил об изменении — расписание берётся заново', async () => {
  let changed: string | null = null
  const get = vi
    .spyOn(doctor, 'get')
    .mockImplementation(async (url: string) => {
      if (url === '/schedule') return { data: SCHEDULE }
      if (url === '/earnings') return { data: EARNINGS }
      return { data: { changed_at: changed } }
    })
  vi.useFakeTimers({ shouldAdvanceTime: true })
  try {
    await renderShell()
    await vi.waitFor(() =>
      expect(get.mock.calls.filter(([u]) => u === '/schedule').length).toBe(1)
    )
    changed = '2026-11-13T10:00:00+00:00'
    await vi.advanceTimersByTimeAsync(31_000)
    await vi.waitFor(() =>
      expect(get.mock.calls.filter(([u]) => u === '/schedule').length).toBe(2)
    )
  } finally {
    vi.useRealTimers()
  }
})
