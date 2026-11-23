import { type PointerEvent, type ReactNode, useRef, useState } from 'react'
import { ArrowUpRight, ChartNoAxesCombined, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Детали дашборда CRM-прототипа компаньона — общие для окна администраторов (с 29.10.2026)
// и панели владельца (волна 1в, 09.11.2026): сетка блоков с переносом, блок с шапкой, плашка.
// Вынесены из reception/dashboard.tsx без изменений вида; стили — reception/crm-dashboard.css.

export type DragState = 'dragging' | 'before' | 'after' | null
export type WidgetView = 'list' | 'chart'

/** Сетка блоков с переносом за шапку — указателем, как у неё: мышь, палец и перо одинаково
 *  (её mountDashboardBuilder). Тянуть начинают за шапку, не за кнопки в ней; Esc — отмена. */
export function Grid<Id extends string>({
  order,
  onReorder,
  children,
}: {
  order: Id[]
  onReorder: (source: Id, target: Id, after: boolean) => void
  children: (id: Id, drag: DragState) => ReactNode
}) {
  const grid = useRef<HTMLDivElement>(null)
  const pointer = useRef<{
    id: number
    x: number
    y: number
    box: Id
  } | null>(null)
  const [dragged, setDragged] = useState<Id | null>(null)
  const [drop, setDrop] = useState<{ id: Id; after: boolean } | null>(null)

  const clear = () => {
    pointer.current = null
    setDragged(null)
    setDrop(null)
  }
  const finish = (commit: boolean, e?: PointerEvent) => {
    if (e && grid.current?.hasPointerCapture(e.pointerId))
      grid.current.releasePointerCapture(e.pointerId)
    if (commit && dragged && drop) onReorder(dragged, drop.id, drop.after)
    clear()
  }
  const boxOf = (el: Element | null) =>
    el?.closest<HTMLElement>('[data-widget]') ?? null

  return (
    <div
      ref={grid}
      className={cn('dashboard-builder-grid', dragged && 'is-reordering')}
      onPointerDown={(e) => {
        const target = e.target as Element
        const bar = target.closest('.dashboard-widget-bar')
        if (
          !bar ||
          e.button !== 0 ||
          target.closest('button:not(.dashboard-drag-handle),a,input,select')
        )
          return
        const box = boxOf(bar)
        if (!box) return
        pointer.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          box: box.dataset.widget as Id,
        }
        grid.current?.setPointerCapture(e.pointerId)
        bar
          .querySelector<HTMLElement>('.dashboard-drag-handle')
          ?.focus({ preventScroll: true })
        e.preventDefault()
      }}
      onPointerMove={(e) => {
        const p = pointer.current
        if (!p || p.id !== e.pointerId) return
        if (!dragged && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 5) return
        if (!dragged) setDragged(p.box)
        e.preventDefault()
        const target = boxOf(document.elementFromPoint(e.clientX, e.clientY))
        const source = grid.current?.querySelector(`[data-widget="${p.box}"]`)
        if (!target || !source || target === source) {
          setDrop(null)
        } else {
          const rect = target.getBoundingClientRect()
          const from = source.getBoundingClientRect()
          const sameRow = Math.abs(from.top - rect.top) < 20
          setDrop({
            id: target.dataset.widget as Id,
            after: sameRow
              ? e.clientX > rect.left + rect.width / 2
              : e.clientY > rect.top + rect.height / 2,
          })
        }
        if (e.clientY < 45) window.scrollBy(0, -18)
        else if (e.clientY > window.innerHeight - 45) window.scrollBy(0, 18)
      }}
      onPointerUp={(e) => {
        if (pointer.current?.id === e.pointerId) finish(true, e)
      }}
      onPointerCancel={(e) => finish(false, e)}
      onLostPointerCapture={clear}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && pointer.current) finish(false)
      }}
    >
      {order.map((id) =>
        children(
          id,
          dragged === id
            ? 'dragging'
            : drop?.id === id
              ? drop.after
                ? 'after'
                : 'before'
              : null
        )
      )}
    </div>
  )
}

/** Блок дашборда — разметка её конструктора: шапка (⠿, «Список / График», название, «−»),
 *  под ней содержимое. Свёрнутый — одна шапка с «+». */
export function Widget({
  id,
  title,
  metric,
  alert,
  wide,
  collapsed,
  onToggle,
  view,
  onView,
  drag,
  children,
}: {
  id: string
  title: string
  metric: boolean
  alert: boolean
  wide: boolean
  collapsed: boolean
  onToggle: () => void
  view?: WidgetView // нет — у блока один вид
  onView?: (view: WidgetView) => void
  drag: DragState
  children: ReactNode
}) {
  return (
    <section
      aria-label={title}
      data-widget={id}
      className={cn(
        'dashboard-widget',
        metric && 'metric-widget',
        metric && alert && 'widget-alert',
        wide && 'wide-widget',
        collapsed && 'widget-folded',
        drag === 'dragging' && 'widget-dragging',
        drag === 'before' && 'widget-drop-before',
        drag === 'after' && 'widget-drop-after'
      )}
    >
      <div
        className='dashboard-widget-bar'
        title='Перетащите шапку, чтобы переместить виджет'
      >
        <button
          type='button'
          className='button quiet compact dashboard-drag-handle'
          aria-label={`Перетащить блок «${title}»`}
          title={`Перетащить блок «${title}»`}
        >
          ⠿
        </button>
        {view && (
          <div
            className='dashboard-widget-views'
            role='group'
            aria-label={`Представление блока «${title}»`}
          >
            <button
              type='button'
              className='widget-view-button'
              aria-label={`Список · ${title}`}
              title='Список'
              aria-pressed={view === 'list'}
              onClick={() => onView?.('list')}
            >
              <Table2 className='icon' aria-hidden />
            </button>
            <button
              type='button'
              className='widget-view-button'
              aria-label={`График · ${title}`}
              title='График'
              aria-pressed={view === 'chart'}
              onClick={() => onView?.('chart')}
            >
              <ChartNoAxesCombined className='icon' aria-hidden />
            </button>
          </div>
        )}
        <h2 className='dashboard-widget-title'>{title}</h2>
        <button
          type='button'
          className='button quiet compact'
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? `Раскрыть блок «${title}»` : `Свернуть блок «${title}»`
          }
          onClick={onToggle}
        >
          {collapsed ? '+' : '−'}
        </button>
      </div>
      {!collapsed && children}
    </section>
  )
}

const WEEKDAY = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
  timeZone: 'UTC',
})

/** Плашка: число «сейчас» и столбики за прошлые дни (решение владельца 29.10.2026). Пока число
 *  не пришло — «загружаю…», не 0; нет данных — «нет данных», не 0; день без данных — пунктирный
 *  пропуск, не нулевой столбик. */
export function Kpi({
  title,
  icon,
  alert = false,
  value,
  missing = false,
  unit = '',
  format,
  note,
  series,
  seriesNote,
  days,
  max,
  onOpen,
  className: extra,
}: {
  title: string
  icon: ReactNode
  alert?: boolean
  onOpen?: () => void // нет — у плашки нет списка (доля «в срок»)
  value: number | null
  missing?: boolean // данных нет (сбой или пустой период) — «нет данных», не «загружаю…»
  unit?: string
  format?: (value: number) => string // деньги — «84 500 ₽»; по умолчанию число и unit
  note: string
  series?: (number | null)[]
  seriesNote?: string
  days?: { day: string }[]
  max?: number
  className?: string // «kpi» — плашка в ряду экрана, не в блоке дашборда
}) {
  const show = (v: number) => (format ? format(v) : `${v}${unit}`)
  const top = max ?? Math.max(1, ...(series ?? []).map((v) => v ?? 0))
  const spoken = (series ?? [])
    .map((v, i) => {
      const day = days?.[i] ? WEEKDAY.format(new Date(days[i].day)) : ''
      return `${day}: ${v === null ? 'нет данных' : show(v)}`
    })
    .join('; ')
  const body = (
    <>
      <span className='dashboard-kpi-label'>
        {icon}
        {title}
        {onOpen && <ArrowUpRight className='icon' aria-hidden />}
      </span>
      <div className='dashboard-kpi-value'>
        <strong>
          {value !== null ? show(value) : missing ? 'нет данных' : 'загружаю…'}
        </strong>
        {series && (
          <div
            className='dashboard-mini-chart'
            role='img'
            aria-label={`${seriesNote}. ${spoken}`}
          >
            {series.map((v, i) => (
              <span key={days?.[i]?.day ?? i} className='dashboard-mini-col'>
                <i
                  className={cn(
                    v === null && 'is-missing',
                    v === 0 && 'is-zero'
                  )}
                  style={
                    v === null ? undefined : { height: `${(v / top) * 100}%` }
                  }
                />
              </span>
            ))}
          </div>
        )}
      </div>
      <small>{note}</small>
      {seriesNote && (
        <small className='dashboard-chart-caption'>{seriesNote}</small>
      )}
    </>
  )
  const className = cn(
    'dashboard-kpi',
    extra,
    alert && value !== null && value > 0 && 'is-alert'
  )
  return onOpen && value !== null ? (
    <button
      type='button'
      className={className}
      aria-label={`Открыть список: ${title}, ${show(value)}`}
      onClick={onOpen}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
