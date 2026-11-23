import { expect, it } from 'vitest'
import { earnings, schedule } from './doctor.ts'

const range = (from: string, to: string) =>
  schedule(new URLSearchParams({ date_from: from, date_to: to }))

it('воскресенье — приёмов нет', () => {
  // 2026-11-29 — воскресенье
  expect(range('2026-11-29', '2026-11-29').rows).toEqual([])
})

it('один и тот же день всегда одинаковый, приёмы внутри дня по порядку', () => {
  const a = range('2026-11-24', '2026-11-24').rows
  expect(a.length).toBeGreaterThanOrEqual(2)
  expect(range('2026-11-24', '2026-11-24').rows).toEqual(a)
  const starts = a.map((r) => r.starts_at)
  expect([...starts].sort()).toEqual(starts)
})

it('неделя — только даты из запрошенного окна', () => {
  const rows = range('2026-11-23', '2026-11-29').rows
  expect(rows.length).toBeGreaterThan(0)
  for (const r of rows) {
    const day = r.starts_at.slice(0, 10)
    expect(day >= '2026-11-23' && day <= '2026-11-29').toBe(true)
  }
})

it('заработок: сумма по дням совпадает с итогом', () => {
  const e = earnings()
  const patients = e.days.reduce((s, d) => s + d.patients, 0)
  if (e.summary === null) expect(e.days).toEqual([])
  else expect(e.summary.patients).toBe(patients)
})
